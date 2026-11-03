"""Episodes: planning, draft versions with optimistic concurrency, comparison and status."""

import difflib
import uuid
from collections.abc import Callable
from typing import TYPE_CHECKING

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.modules.catalog import CatalogService
from app.modules.identity import CurrentUser
from app.modules.writing import status as status_rules
from app.modules.writing.models import (
    Character,
    DraftSource,
    Episode,
    EpisodeDraft,
    EpisodePlan,
    EpisodeStatus,
)
from app.modules.writing.schemas import (
    Beat,
    CompareOut,
    DiffOp,
    DraftOut,
    DraftSummary,
    EpisodeOut,
    PlanIn,
    PlanOut,
    ScriptLineOut,
)
from app.modules.writing.script import estimated_seconds, parse_script, word_count
from app.shared.audit import record_audit
from app.shared.errors import Conflict, Forbidden, NotFound, ValidationFailed

if TYPE_CHECKING:
    from app.container import Container


class EpisodeService:
    def __init__(self, db: Session, container: "Container") -> None:
        self.db = db
        self.container = container
        self.catalog = CatalogService(db, container)

    # Loading ---------------------------------------------------------------------------------

    def _episode(self, episode_id: uuid.UUID) -> Episode:
        episode = self.db.get(Episode, episode_id)
        if episode is None:
            raise NotFound("Episode not found")
        return episode

    def get(self, episode_id: uuid.UUID) -> Episode:
        """System read without user scoping (for other modules' internal use)."""
        return self._episode(episode_id)

    def get_for_user(self, user: CurrentUser, episode_id: uuid.UUID) -> Episode:
        episode = self._episode(episode_id)
        self.catalog.get_series_for_user(user, episode.series_id)  # 404 for other writers
        return episode

    def _plan(self, episode: Episode) -> EpisodePlan:
        plan = self.db.scalar(select(EpisodePlan).where(EpisodePlan.episode_id == episode.id))
        if plan is None:
            plan = EpisodePlan(episode_id=episode.id, beats=[], notes="")
            self.db.add(plan)
            self.db.flush()
        return plan

    def _current_draft(self, episode: Episode) -> EpisodeDraft | None:
        return (
            self.db.get(EpisodeDraft, episode.current_draft_id)
            if episode.current_draft_id
            else None
        )

    def to_out(self, episode: Episode) -> EpisodeOut:
        plan = self._plan(episode)
        draft = self._current_draft(episode)
        text = draft.text if draft else ""
        series = self.catalog.get_series(episode.series_id)
        return EpisodeOut(
            id=episode.id,
            series_id=episode.series_id,
            number=episode.number,
            title=episode.title,
            status=episode.status,
            current_version=draft.version if draft else None,
            word_count=word_count(text),
            estimated_seconds=estimated_seconds(text),
            target_seconds=series.target_episode_minutes * 60,
            is_free=episode.is_free,
            published_at=episode.published_at,
            plan=PlanOut(beats=[Beat.model_validate(b) for b in plan.beats], notes=plan.notes),
            created_at=episode.created_at,
            updated_at=episode.updated_at,
        )

    def list_for_series(self, user: CurrentUser, series_id: uuid.UUID) -> list[EpisodeOut]:
        self.catalog.get_series_for_user(user, series_id)
        episodes = self.db.scalars(
            select(Episode).where(Episode.series_id == series_id).order_by(Episode.number)
        )
        return [self.to_out(e) for e in episodes]

    # Episode CRUD ----------------------------------------------------------------------------

    def create(self, user: CurrentUser, series_id: uuid.UUID, title: str) -> Episode:
        self.catalog.get_series_for_user(user, series_id)
        last = self.db.scalar(
            select(func.max(Episode.number)).where(Episode.series_id == series_id)
        )
        episode = Episode(series_id=series_id, number=(last or 0) + 1, title=title)
        self.db.add(episode)
        self.db.flush()
        self.db.add(EpisodePlan(episode_id=episode.id, beats=[], notes=""))
        self._audit(user, "episode.create", episode)
        return episode

    def update_title(self, user: CurrentUser, episode_id: uuid.UUID, title: str) -> Episode:
        episode = self.get_for_user(user, episode_id)
        episode.title = title
        self._audit(user, "episode.update", episode)
        return episode

    def delete(self, user: CurrentUser, episode_id: uuid.UUID) -> None:
        episode = self.get_for_user(user, episode_id)
        if episode.status != EpisodeStatus.PLANNED:
            raise Conflict("Only planned episodes can be deleted", code="episode_not_deletable")
        series_id, number = episode.series_id, episode.number
        self.db.delete(episode)
        self.db.flush()
        # Close the gap so numbering stays continuous.
        self.db.execute(
            update(Episode)
            .where(Episode.series_id == series_id, Episode.number > number)
            .values(number=Episode.number - 1)
        )
        record_audit(
            self.db,
            actor_id=user.id,
            action="episode.delete",
            entity_type="episode",
            entity_id=episode_id,
            metadata={"series_id": str(series_id), "number": number},
        )

    def reorder(
        self, user: CurrentUser, series_id: uuid.UUID, episode_ids: list[uuid.UUID]
    ) -> None:
        self.catalog.get_series_for_user(user, series_id)
        episodes = {
            e.id: e for e in self.db.scalars(select(Episode).where(Episode.series_id == series_id))
        }
        if set(episode_ids) != set(episodes) or len(episode_ids) != len(episodes):
            raise ValidationFailed("List every episode exactly once", code="invalid_episode_order")
        for position, episode_id in enumerate(episode_ids, start=1):
            episode = episodes[episode_id]
            if episode.published_at is not None and episode.number != position:
                raise Conflict(
                    "Published episodes keep their number", code="published_episode_moved"
                )
        # Two passes avoid clashing with the unique (series_id, number) constraint.
        for position, episode_id in enumerate(episode_ids, start=1):
            self.db.execute(
                update(Episode).where(Episode.id == episode_id).values(number=-position)
            )
        for position, episode_id in enumerate(episode_ids, start=1):
            self.db.execute(update(Episode).where(Episode.id == episode_id).values(number=position))
        self.db.expire_all()
        record_audit(
            self.db,
            actor_id=user.id,
            action="episode.reorder",
            entity_type="series",
            entity_id=series_id,
        )

    def set_plan(self, user: CurrentUser, episode_id: uuid.UUID, data: PlanIn) -> Episode:
        episode = self.get_for_user(user, episode_id)
        ids = [b.id for b in data.beats]
        if len(ids) != len(set(ids)):
            raise ValidationFailed("Beat ids must be unique", code="duplicate_beat")
        plan = self._plan(episode)
        plan.beats = [b.model_dump() for b in data.beats]
        plan.notes = data.notes
        self._audit(user, "episode.plan_update", episode)
        return episode

    # Drafts ----------------------------------------------------------------------------------

    def _next_version(self, episode: Episode) -> int:
        last = self.db.scalar(
            select(func.max(EpisodeDraft.version)).where(EpisodeDraft.episode_id == episode.id)
        )
        return (last or 0) + 1

    def _add_version(
        self,
        episode: Episode,
        text: str,
        source: DraftSource,
        created_by: uuid.UUID | None,
        note: str,
    ) -> EpisodeDraft:
        draft = EpisodeDraft(
            episode_id=episode.id,
            version=self._next_version(episode),
            text=text,
            source=source,
            created_by=created_by,
            note=note,
        )
        self.db.add(draft)
        self.db.flush()
        episode.current_draft_id = draft.id
        if episode.status in status_rules.EDITABLE_BACK_TO_DRAFTING:
            status_rules.transition(episode, EpisodeStatus.DRAFTING)
        return draft

    def save_draft(
        self,
        user: CurrentUser,
        episode_id: uuid.UUID,
        text: str,
        base_version: int | None,
        note: str = "",
    ) -> tuple[EpisodeDraft, bool]:
        """Saves the writer's text. Returns ``(draft, created)``; unchanged text adds no version."""
        episode = self.get_for_user(user, episode_id)
        if episode.status == EpisodeStatus.IN_REVIEW:
            raise Conflict("The episode is being reviewed", code="episode_in_review")
        current = self._current_draft(episode)
        current_version = current.version if current else None
        if base_version != current_version:
            raise Conflict(
                "A newer version was saved since you started editing",
                code="version_conflict",
                details={"current_version": current_version},
            )
        if current is not None and current.text == text:
            return current, False
        draft = self._add_version(episode, text, DraftSource.HUMAN, user.id, note)
        self._audit(user, "episode.draft_save", episode, {"version": draft.version})
        return draft, True

    def save_ai_draft(self, episode_id: uuid.UUID, text: str, note: str = "") -> EpisodeDraft:
        """Used by the AI module; always records the source as ``ai``."""
        episode = self._episode(episode_id)
        return self._add_version(episode, text, DraftSource.AI, None, note)

    def save_writer_draft_from_workflow(
        self, episode_id: uuid.UUID, text: str, user_id: uuid.UUID, note: str = ""
    ) -> EpisodeDraft:
        """Saves text the writer submitted while answering a workflow step (source ``human``)."""
        episode = self._episode(episode_id)
        current = self._current_draft(episode)
        if current is not None and current.text == text:
            return current
        return self._add_version(episode, text, DraftSource.HUMAN, user_id, note)

    def replace_script_line(
        self, user: CurrentUser, episode_id: uuid.UUID, source_line: int, new_line: str
    ) -> EpisodeDraft:
        """Fixes one line during audio production. Saves a new version but keeps the episode in
        its audio status, so only that line is re-recorded."""
        episode = self.get_for_user(user, episode_id)
        if episode.status not in (EpisodeStatus.READY_FOR_AUDIO, EpisodeStatus.AUDIO_READY):
            raise Conflict("Lines can be fixed during audio production only", code="not_in_audio")
        current = self._current_draft(episode)
        lines = current.text.splitlines() if current else []
        if not 0 <= source_line < len(lines) or "\n" in new_line or not new_line.strip():
            raise ValidationFailed("That line does not exist", code="invalid_line")
        lines[source_line] = new_line.strip()
        draft = EpisodeDraft(
            episode_id=episode.id,
            version=self._next_version(episode),
            text="\n".join(lines),
            source=DraftSource.HUMAN,
            created_by=user.id,
            note=f"Fixed line {source_line + 1} during audio production",
        )
        self.db.add(draft)
        self.db.flush()
        episode.current_draft_id = draft.id
        self._audit(user, "episode.line_fix", episode, {"version": draft.version})
        return draft

    def set_current_audio(self, episode_id: uuid.UUID, audio_asset_id: uuid.UUID) -> None:
        self._episode(episode_id).current_audio_id = audio_asset_id

    def current_text(self, episode_id: uuid.UUID) -> tuple[int | None, str]:
        """``(version, text)`` of the current draft; ``(None, "")`` before the first draft."""
        draft = self._current_draft(self._episode(episode_id))
        return (draft.version, draft.text) if draft else (None, "")

    def episodes_before(self, series_id: uuid.UUID, number: int) -> list[Episode]:
        """Earlier episodes of a series, in order (system read)."""
        return list(
            self.db.scalars(
                select(Episode)
                .where(Episode.series_id == series_id, Episode.number < number)
                .order_by(Episode.number)
            )
        )

    def plan(self, episode_id: uuid.UUID) -> PlanOut:
        plan = self._plan(self._episode(episode_id))
        return PlanOut(beats=[Beat.model_validate(b) for b in plan.beats], notes=plan.notes)

    def _draft(self, episode: Episode, version: int) -> EpisodeDraft:
        draft = self.db.scalar(
            select(EpisodeDraft).where(
                EpisodeDraft.episode_id == episode.id, EpisodeDraft.version == version
            )
        )
        if draft is None:
            raise NotFound("Version not found")
        return draft

    def list_drafts(self, user: CurrentUser, episode_id: uuid.UUID) -> list[DraftSummary]:
        episode = self.get_for_user(user, episode_id)
        drafts = self.db.scalars(
            select(EpisodeDraft)
            .where(EpisodeDraft.episode_id == episode.id)
            .order_by(EpisodeDraft.version.desc())
        )
        return [_summary(d) for d in drafts]

    def get_draft(self, user: CurrentUser, episode_id: uuid.UUID, version: int) -> DraftOut:
        episode = self.get_for_user(user, episode_id)
        return draft_out(self._draft(episode, version))

    def restore(self, user: CurrentUser, episode_id: uuid.UUID, version: int) -> EpisodeDraft:
        episode = self.get_for_user(user, episode_id)
        if episode.status == EpisodeStatus.IN_REVIEW:
            raise Conflict("The episode is being reviewed", code="episode_in_review")
        old = self._draft(episode, version)
        draft = self._add_version(
            episode, old.text, DraftSource.HUMAN, user.id, f"Restored from v{version}"
        )
        self._audit(user, "episode.draft_restore", episode, {"from": version, "to": draft.version})
        return draft

    def compare(self, user: CurrentUser, episode_id: uuid.UUID, a: int, b: int) -> CompareOut:
        episode = self.get_for_user(user, episode_id)
        a_lines = self._draft(episode, a).text.splitlines()
        b_lines = self._draft(episode, b).text.splitlines()
        matcher = difflib.SequenceMatcher(a=a_lines, b=b_lines, autojunk=False)
        ops = [
            DiffOp(op=tag, a_lines=a_lines[i1:i2], b_lines=b_lines[j1:j2])
            for tag, i1, i2, j1, j2 in matcher.get_opcodes()
        ]
        return CompareOut(a=a, b=b, ops=ops)

    def script(self, user: CurrentUser, episode_id: uuid.UUID) -> list[ScriptLineOut]:
        episode = self.get_for_user(user, episode_id)
        return self.script_for(episode.id)

    def script_for(self, episode_id: uuid.UUID) -> list[ScriptLineOut]:
        episode = self._episode(episode_id)
        draft = self._current_draft(episode)
        names = list(
            self.db.scalars(select(Character.name).where(Character.series_id == episode.series_id))
        )
        return [
            ScriptLineOut(**line.__dict__)
            for line in parse_script(draft.text if draft else "", names)
        ]

    # Status ----------------------------------------------------------------------------------

    def writer_set_status(
        self, user: CurrentUser, episode_id: uuid.UUID, target: EpisodeStatus
    ) -> Episode:
        episode = self.get_for_user(user, episode_id)
        if (episode.status, target) not in status_rules.WRITER_MANUAL:
            raise Forbidden(
                "This status change happens through drafting, audio or review",
                code="status_change_not_allowed",
            )
        if target == EpisodeStatus.READY_FOR_AUDIO and episode.current_draft_id is None:
            raise Conflict("Write or draft the episode first", code="episode_has_no_text")
        self._check_status_guards(episode, target)
        status_rules.transition(episode, target)
        self._audit(user, "episode.status", episode, {"status": target.value})
        return episode

    def set_status(self, episode_id: uuid.UUID, target: EpisodeStatus) -> Episode:
        """System transitions used by drafting, audio and review (no user check)."""
        episode = self._episode(episode_id)
        self._check_status_guards(episode, target)
        status_rules.transition(episode, target)
        return episode

    # Other modules register checks that can block a status change (e.g. open continuity
    # errors block ready_for_audio in plan 06).
    def _check_status_guards(self, episode: Episode, target: EpisodeStatus) -> None:
        for guard in STATUS_GUARDS:
            guard(self.db, episode.id, target)

    def _audit(
        self, user: CurrentUser, action: str, episode: Episode, extra: dict | None = None
    ) -> None:
        record_audit(
            self.db,
            actor_id=user.id,
            action=action,
            entity_type="episode",
            entity_id=episode.id,
            metadata={"series_id": str(episode.series_id), **(extra or {})},
        )


StatusGuard = Callable[[Session, uuid.UUID, EpisodeStatus], None]
STATUS_GUARDS: list[StatusGuard] = []


def register_status_guard(guard: StatusGuard) -> StatusGuard:
    """Lets other modules block a status change by raising (e.g. open continuity errors)."""
    if guard not in STATUS_GUARDS:
        STATUS_GUARDS.append(guard)
    return guard


def _summary(draft: EpisodeDraft) -> DraftSummary:
    return DraftSummary(
        version=draft.version,
        source=draft.source,
        created_by=draft.created_by,
        note=draft.note,
        word_count=word_count(draft.text),
        estimated_seconds=estimated_seconds(draft.text),
        created_at=draft.created_at,
    )


def draft_out(draft: EpisodeDraft) -> DraftOut:
    return DraftOut(**_summary(draft).model_dump(), text=draft.text)
