"""Admin-area reads and edits that span modules: audit log, writer stats, episode access."""

import uuid
from datetime import UTC, date, datetime, time, timedelta
from typing import TYPE_CHECKING, Any

from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.modules.catalog import CatalogService
from app.modules.identity import CurrentUser
from app.modules.writing import EpisodeService
from app.shared.audit import AuditLog, record_audit

if TYPE_CHECKING:
    from app.container import Container


def audit_query(
    *,
    actor_id: uuid.UUID | None,
    entity_type: str | None,
    entity_id: str | None,
    start: date | None,
    end: date | None,
) -> Select[AuditLog]:
    stmt = select(AuditLog).order_by(AuditLog.created_at.desc())
    if actor_id:
        stmt = stmt.where(AuditLog.actor_id == actor_id)
    if entity_type:
        stmt = stmt.where(AuditLog.entity_type == entity_type)
    if entity_id:
        stmt = stmt.where(AuditLog.entity_id == entity_id)
    if start:
        stmt = stmt.where(AuditLog.created_at >= datetime.combine(start, time.min, UTC))
    if end:
        stmt = stmt.where(
            AuditLog.created_at < datetime.combine(end + timedelta(days=1), time.min, UTC)
        )
    return stmt


class AdminCatalogService:
    def __init__(self, db: Session, container: "Container") -> None:
        self.db = db
        self.container = container

    def writer_series_counts(self) -> dict[uuid.UUID, int]:
        return CatalogService(self.db, self.container).series_counts_by_owner()

    def set_episode_access(
        self, admin: CurrentUser, episode_id: uuid.UUID, is_free: bool | None
    ) -> dict[str, Any]:
        episode = EpisodeService(self.db, self.container).set_access(episode_id, is_free)
        record_audit(
            self.db,
            actor_id=admin.id,
            action="episode.access",
            entity_type="episode",
            entity_id=episode_id,
            metadata={"is_free": is_free},
        )
        return {"episode_id": str(episode.id), "is_free": episode.is_free}
