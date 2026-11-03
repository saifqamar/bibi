"""Continuity graph nodes. Issues are stored as they are found; state carries only counts."""

import re
import uuid
from typing import Any

from app.modules.ai import prompts
from app.modules.ai.adapters.ports import LLMMessage
from app.modules.ai.continuity import ContinuityService
from app.modules.ai.engine import Deps
from app.modules.writing import BibleService, EpisodeService, SummaryService

MAX_PASSAGES = 12
PASSAGE_CHARS = 500
EARLIER_SUMMARIES = 5


def _ids(state: dict[str, Any]) -> tuple[uuid.UUID, uuid.UUID, uuid.UUID]:
    return uuid.UUID(state["run_id"]), uuid.UUID(state["episode_id"]), uuid.UUID(state["series_id"])


def prepare(deps: Deps, state: dict[str, Any]) -> dict[str, Any]:
    _, episode_id, _ = _ids(state)
    with deps.session() as db:
        version, text = EpisodeService(db, deps.container).current_text(episode_id)
        ContinuityService(db).refresh_for_text(episode_id, text)
    return {"draft_version": version or 0}


def deterministic_checks(deps: Deps, state: dict[str, Any]) -> dict[str, Any]:
    """Cheap checks that need no model: speaker tags that match no bible character."""
    run_id, episode_id, _ = _ids(state)
    with deps.session() as db:
        episodes = EpisodeService(db, deps.container)
        _, text = episodes.current_text(episode_id)
        found = []
        seen: set[str] = set()
        for line in episodes.script_for(episode_id):
            if line.unknown_speaker and line.unknown_speaker.lower() not in seen:
                seen.add(line.unknown_speaker.lower())
                found.append(
                    {
                        "severity": "warning",
                        "type": "naming",
                        "description": (
                            f'"{line.unknown_speaker}" speaks but is not a character in the story '
                            "bible; the line will use the narrator's voice."
                        ),
                        "quote": f"{line.unknown_speaker}:",
                        "source": {"kind": "bible", "entity_type": "characters"},
                    }
                )
        ContinuityService(db).record(
            episode_id=episode_id,
            run_id=run_id,
            draft_version=state.get("draft_version", 0),
            text=text,
            found=found,
        )
    return {}


def _passages(
    db: Any, deps: Deps, series_id: uuid.UUID, number: int, text: str, names: list[str]
) -> list[dict[str, Any]]:
    """Paragraphs from earlier episodes that mention characters appearing in this episode."""
    present = [n for n in names if re.search(rf"\b{re.escape(n)}\b", text, re.IGNORECASE)]
    if not present:
        return []
    pattern = re.compile("|".join(rf"\b{re.escape(n)}\b" for n in present), re.IGNORECASE)
    episodes = EpisodeService(db, deps.container)
    picked: list[dict[str, Any]] = []
    for earlier in reversed(episodes.episodes_before(series_id, number)):
        _, earlier_text = episodes.current_text(earlier.id)
        for paragraph in re.split(r"\n\s*\n", earlier_text):
            if pattern.search(paragraph):
                picked.append({"number": earlier.number, "text": paragraph.strip()[:PASSAGE_CHARS]})
                if len(picked) >= MAX_PASSAGES:
                    return picked
    return picked


def llm_check(deps: Deps, state: dict[str, Any]) -> dict[str, Any]:
    run_id, episode_id, series_id = _ids(state)
    with deps.session() as db:
        episodes = EpisodeService(db, deps.container)
        episode = episodes.get(episode_id)
        _, text = episodes.current_text(episode_id)
        if not text.strip():
            return {}
        bible = BibleService(db, deps.container).snapshot(series_id)
        names = [c["name"] for c in bible["characters"]]
        summaries = [
            {"number": h.number, "summary": h.summary}
            for h in SummaryService(db).recent_before(series_id, episode.number, EARLIER_SUMMARIES)
        ]
        result = deps.metered(db, state, "continuity").complete(
            system=prompts.CONTINUITY_SYSTEM,
            messages=[
                LLMMessage(
                    "user",
                    prompts.continuity_user_prompt(
                        bible=bible,
                        summaries=summaries,
                        passages=_passages(db, deps, series_id, episode.number, text, names),
                        episode_number=episode.number,
                        text=text,
                    ),
                )
            ],
            max_tokens=8000,
            json_schema=prompts.CONTINUITY_SCHEMA,
            task="continuity_check",
        )
        ContinuityService(db).record(
            episode_id=episode_id,
            run_id=run_id,
            draft_version=state.get("draft_version", 0),
            text=text,
            found=list((result.data or {}).get("issues", [])),
        )
    return {}


def tally(deps: Deps, state: dict[str, Any]) -> dict[str, Any]:
    _, episode_id, _ = _ids(state)
    with deps.session() as db:
        return {"open_errors": ContinuityService(db).open_errors(episode_id)}
