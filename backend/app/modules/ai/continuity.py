"""Continuity issues: storing check results, the ready-for-audio gate, and writer resolutions."""

import re
import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.ai.models import ContinuityIssue, IssueSeverity, IssueStatus
from app.modules.writing import EpisodeStatus, register_status_guard
from app.shared.audit import record_audit
from app.shared.errors import Conflict, NotFound, ValidationFailed

_SPACE = re.compile(r"\s+")


def normalize(text: str) -> str:
    return _SPACE.sub(" ", text).strip().lower()


def quote_in_text(quote: str, text: str) -> bool:
    q = normalize(quote)
    return bool(q) and q in normalize(text)


class ContinuityService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def issues(
        self, episode_id: uuid.UUID, status: IssueStatus | None = None
    ) -> list[ContinuityIssue]:
        stmt = select(ContinuityIssue).where(ContinuityIssue.episode_id == episode_id)
        if status:
            stmt = stmt.where(ContinuityIssue.status == status)
        severity_order = ContinuityIssue.severity == IssueSeverity.WARNING
        return list(self.db.scalars(stmt.order_by(severity_order, ContinuityIssue.created_at)))

    def open_errors(self, episode_id: uuid.UUID) -> int:
        return sum(
            1
            for issue in self.issues(episode_id, IssueStatus.OPEN)
            if issue.severity == IssueSeverity.ERROR
        )

    def refresh_for_text(self, episode_id: uuid.UUID, text: str) -> None:
        """Before a re-check: open issues whose quote is gone from the text are fixed."""
        for issue in self.issues(episode_id, IssueStatus.OPEN):
            if not quote_in_text(issue.quote, text):
                issue.status = IssueStatus.FIXED
                issue.resolution_note = "The quoted text is no longer in the episode."
                issue.resolved_at = datetime.now(UTC)
        self.db.flush()

    def record(
        self,
        *,
        episode_id: uuid.UUID,
        run_id: uuid.UUID | None,
        draft_version: int,
        text: str,
        found: list[dict[str, Any]],
    ) -> list[ContinuityIssue]:
        """Stores validated issues. Drops issues not grounded in the text, duplicates of open
        issues, and anything the writer already marked intentional for the same quote."""
        known = {
            (i.type, normalize(i.quote)): i
            for i in self.issues(episode_id)
            if i.status in (IssueStatus.OPEN, IssueStatus.INTENTIONAL)
        }
        stored = []
        for raw in found:
            quote = str(raw.get("quote", ""))
            key = (str(raw.get("type")), normalize(quote))
            if not quote_in_text(quote, text) or key in known:
                continue
            issue = ContinuityIssue(
                workflow_run_id=run_id,
                episode_id=episode_id,
                draft_version=draft_version,
                severity=IssueSeverity(raw.get("severity", "warning")),
                type=key[0],
                description=str(raw.get("description", ""))[:2000],
                quote=quote[:2000],
                source_ref=raw.get("source") or {},
            )
            self.db.add(issue)
            known[key] = issue
            stored.append(issue)
        self.db.flush()
        return stored

    def get(self, issue_id: uuid.UUID) -> ContinuityIssue:
        issue = self.db.get(ContinuityIssue, issue_id)
        if issue is None:
            raise NotFound("Issue not found")
        return issue

    def resolve(
        self, issue: ContinuityIssue, status: IssueStatus, note: str, user_id: uuid.UUID
    ) -> ContinuityIssue:
        if status == IssueStatus.OPEN:
            raise ValidationFailed("Choose fixed or intentional", code="invalid_resolution")
        if status == IssueStatus.INTENTIONAL and not note.strip():
            raise ValidationFailed(
                "Say why this is intentional so it is not flagged again", code="note_required"
            )
        if issue.status != IssueStatus.OPEN:
            raise Conflict("This issue is already resolved", code="issue_resolved")
        issue.status = status
        issue.resolution_note = note
        issue.resolved_by = user_id
        issue.resolved_at = datetime.now(UTC)
        record_audit(
            self.db,
            actor_id=user_id,
            action=f"continuity.{status.value}",
            entity_type="continuity_issue",
            entity_id=issue.id,
            metadata={"episode_id": str(issue.episode_id)},
        )
        return issue


@register_status_guard
def _block_audio_with_open_errors(
    db: Session, episode_id: uuid.UUID, target: EpisodeStatus
) -> None:
    if target != EpisodeStatus.READY_FOR_AUDIO:
        return
    count = ContinuityService(db).open_errors(episode_id)
    if count:
        raise Conflict(
            f"Resolve {count} continuity error(s) before producing audio",
            code="continuity_errors_open",
            details={"open_errors": count},
        )
