"""Drafting graph nodes. State holds IDs and small flags only; text lives in Postgres."""

import logging
import uuid
from typing import Any

from langgraph.types import interrupt
from pydantic import ValidationError

from app.modules.ai import prompts
from app.modules.ai.adapters.ports import LLMMessage
from app.modules.ai.engine import Deps
from app.modules.catalog import CatalogService
from app.modules.writing import (
    BibleService,
    EpisodeService,
    EpisodeStatus,
    ProposalIn,
    SummaryService,
)
from app.shared.errors import AppError, Conflict

logger = logging.getLogger(__name__)

WORDS_PER_MINUTE = 150
RECENT_EPISODES = 2
SIMILAR_EPISODES = 3
CONTEXT_CHARS = 600


def _ids(state: dict[str, Any]) -> tuple[uuid.UUID, uuid.UUID]:
    return uuid.UUID(state["episode_id"]), uuid.UUID(state["series_id"])


def load_context(deps: Deps, state: dict[str, Any]) -> dict[str, Any]:
    episode_id, series_id = _ids(state)
    with deps.session() as db:
        episodes = EpisodeService(db, deps.container)
        episode = episodes.get(episode_id)
        if not episodes.plan(episode_id).beats:
            raise Conflict("Add at least one beat before drafting", code="plan_has_no_beats")
        if episode.status == EpisodeStatus.PLANNED:
            episodes.set_status(episode_id, EpisodeStatus.DRAFTING)
        summaries = SummaryService(db)
        recent = summaries.recent_before(series_id, episode.number, RECENT_EPISODES)
        beats_text = " ".join(b.text for b in episodes.plan(episode_id).beats)
        vector = deps.metered(db, state, "embedding").embed([beats_text]).vectors[0]
        similar = summaries.similar(
            series_id, vector, before_number=episode.number, limit=SIMILAR_EPISODES
        )
    context_ids = list(dict.fromkeys(str(h.episode_id) for h in [*similar, *recent]))
    return {"context_episode_ids": context_ids}


def _previous(db: Any, deps: Deps, state: dict[str, Any]) -> list[dict[str, Any]]:
    episode_id, series_id = _ids(state)
    episode = EpisodeService(db, deps.container).get(episode_id)
    wanted = set(state.get("context_episode_ids", []))
    summaries = SummaryService(db).recent_before(series_id, episode.number, 10_000)
    return [
        {"number": h.number, "title": h.title, "summary": h.summary}
        for h in summaries
        if str(h.episode_id) in wanted
    ]


def draft(deps: Deps, state: dict[str, Any]) -> dict[str, Any]:
    episode_id, series_id = _ids(state)
    with deps.session() as db:
        episodes = EpisodeService(db, deps.container)
        episode = episodes.get(episode_id)
        series = CatalogService(db, deps.container).get_series(series_id)
        plan = episodes.plan(episode_id)
        user = prompts.draft_user_prompt(
            series={
                "title": series.title,
                "premise": series.premise,
                "tone": series.tone,
                "themes": list(series.themes),
                "language": series.language,
            },
            episode_number=episode.number,
            episode_title=episode.title,
            beats=[b.text for b in plan.beats],
            notes=plan.notes,
            bible=BibleService(db, deps.container).snapshot(series_id),
            previous=_previous(db, deps, state),
            target_words=series.target_episode_minutes * WORDS_PER_MINUTE,
        )
        result = deps.metered(db, state, "drafting").complete(
            system=prompts.DRAFT_SYSTEM,
            messages=[LLMMessage("user", user)],
            max_tokens=32000,
            task="draft",
        )
        saved = episodes.save_ai_draft(
            episode_id, result.text.strip(), note=f"AI draft ({prompts.DRAFT_VERSION})"
        )
    return {"draft_version": saved.version}


def writer_review(deps: Deps, state: dict[str, Any]) -> dict[str, Any]:
    decision = interrupt({"kind": "draft_review", "draft_version": state.get("draft_version")})
    action = decision.get("action")
    if action == "edit":
        episode_id, _ = _ids(state)
        with deps.session() as db:
            saved = EpisodeService(db, deps.container).save_writer_draft_from_workflow(
                episode_id,
                decision["text"],
                uuid.UUID(decision["user_id"]),
                note="Edited during review",
            )
        return {"review": "approve", "draft_version": saved.version, "sections": None}
    if action == "regenerate":
        return {"review": "regenerate", "sections": decision["sections"]}
    return {"review": "approve", "sections": None}


def apply_section_rewrites(deps: Deps, state: dict[str, Any]) -> dict[str, Any]:
    """Rewrites the selected character ranges of the current draft (last to first)."""
    episode_id, _ = _ids(state)
    sections = sorted(state.get("sections") or [], key=lambda s: s["start"], reverse=True)
    with deps.session() as db:
        episodes = EpisodeService(db, deps.container)
        _, text = episodes.current_text(episode_id)
        llm = deps.metered(db, state, "regeneration")
        for section in sections:
            start, end = int(section["start"]), int(section["end"])
            if not 0 <= start < end <= len(text):
                continue  # the text changed since the selection; skip rather than corrupt it
            result = llm.complete(
                system=prompts.REGENERATE_SYSTEM,
                messages=[
                    LLMMessage(
                        "user",
                        prompts.regenerate_user_prompt(
                            before=text[max(0, start - CONTEXT_CHARS) : start],
                            passage=text[start:end],
                            after=text[end : end + CONTEXT_CHARS],
                            note=section.get("note", ""),
                        ),
                    )
                ],
                max_tokens=8000,
                task="regenerate_section",
            )
            text = text[:start] + result.text.strip() + text[end:]
        saved = episodes.save_ai_draft(
            episode_id, text, note=f"Regenerated {len(sections)} section(s)"
        )
    return {"draft_version": saved.version, "sections": None}


def resolve_contradictions(deps: Deps, state: dict[str, Any]) -> dict[str, Any]:
    interrupt({"kind": "contradictions", "draft_version": state.get("draft_version")})
    return {}


def propose_canon(deps: Deps, state: dict[str, Any]) -> dict[str, Any]:
    episode_id, series_id = _ids(state)
    created: list[str] = []
    with deps.session() as db:
        episode = EpisodeService(db, deps.container).get(episode_id)
        _, text = EpisodeService(db, deps.container).current_text(episode_id)
        bible = BibleService(db, deps.container)
        result = deps.metered(db, state, "canon").complete(
            system=prompts.CANON_SYSTEM,
            messages=[
                LLMMessage(
                    "user",
                    prompts.canon_user_prompt(
                        bible=bible.snapshot(series_id), episode_number=episode.number, text=text
                    ),
                )
            ],
            max_tokens=8000,
            json_schema=prompts.CANON_SCHEMA,
            task="propose_canon",
        )
        for raw in (result.data or {}).get("proposals", []):
            try:
                with db.begin_nested():
                    proposal = bible.propose(
                        series_id, ProposalIn.model_validate({**raw, "episode_id": episode_id})
                    )
                created.append(str(proposal.id))
            except (ValidationError, AppError) as exc:
                # A malformed or stale suggestion is dropped; the writer can add it by hand.
                logger.warning("canon_proposal_skipped", extra={"reason": str(exc)})
    return {"proposal_ids": created}


def confirm_canon(deps: Deps, state: dict[str, Any]) -> dict[str, Any]:
    interrupt({"kind": "canon_confirmation", "proposal_ids": state.get("proposal_ids", [])})
    return {}


def finalize(deps: Deps, state: dict[str, Any]) -> dict[str, Any]:
    episode_id, series_id = _ids(state)
    with deps.session() as db:
        episodes = EpisodeService(db, deps.container)
        episode = episodes.get(episode_id)
        version, text = episodes.current_text(episode_id)
        summary = deps.metered(db, state, "summary").complete(
            system=prompts.SUMMARY_SYSTEM,
            messages=[
                LLMMessage(
                    "user", prompts.summary_user_prompt(episode_number=episode.number, text=text)
                )
            ],
            max_tokens=2000,
            task="summarize",
        )
        vector = deps.metered(db, state, "embedding").embed([summary.text]).vectors[0]
        SummaryService(db).upsert(episode_id, series_id, version or 0, summary.text.strip(), vector)
        if episode.status == EpisodeStatus.DRAFTING:
            episodes.set_status(episode_id, EpisodeStatus.READY_FOR_AUDIO)
    return {"finished": True}
