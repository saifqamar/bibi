"""Catalog service: series records, shelves, covers and what listeners are allowed to see."""

import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Select, delete, func, select, update
from sqlalchemy.orm import Session

from app.modules.catalog.models import CoverAsset, Series, SeriesStatus, Shelf, ShelfItem
from app.modules.catalog.schemas import (
    AdminSeriesUpdate,
    AdminShelfOut,
    ListenerSeriesOut,
    ListenerShelfOut,
    SeriesCreate,
    SeriesOut,
    SeriesUpdate,
    ShelfCreate,
    ShelfUpdate,
)
from app.modules.identity import (
    CurrentUser,
    Role,
    UserStatus,
    ensure_owner_or_admin,
    lookup_user,
)
from app.shared.audit import record_audit
from app.shared.errors import NotFound, ValidationFailed
from app.shared.pagination import PageParams

if TYPE_CHECKING:
    from app.container import Container

COVER_TYPES = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}
COVER_MAX_BYTES = 5 * 1024 * 1024
COVER_URL_TTL_SECONDS = 24 * 3600
LISTENER_VISIBLE = (SeriesStatus.PUBLISHED,)


def _sniff_image(data: bytes) -> str | None:
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if data.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    return None


def _escape_like(term: str) -> str:
    return term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


class CatalogService:
    def __init__(self, db: Session, container: "Container") -> None:
        self.db = db
        self.container = container

    # Series ----------------------------------------------------------------------------------

    def _series(self, series_id: uuid.UUID) -> Series:
        series = self.db.get(Series, series_id)
        if series is None:
            raise NotFound("Series not found")
        return series

    def get_series_for_user(self, user: CurrentUser, series_id: uuid.UUID) -> Series:
        """Writers only see their own series (others look missing); admins see all."""
        series = self._series(series_id)
        ensure_owner_or_admin(user, series.owner_writer_id)
        return series

    def studio_series_query(
        self, user: CurrentUser, *, status: SeriesStatus | None = None, q: str | None = None
    ) -> Select[Series]:
        stmt = select(Series).order_by(Series.updated_at.desc())
        if user.role != Role.ADMIN:
            stmt = stmt.where(Series.owner_writer_id == user.id)
        if status:
            stmt = stmt.where(Series.status == status)
        if q:
            stmt = stmt.where(Series.title.ilike(f"%{_escape_like(q)}%", escape="\\"))
        return stmt

    def create_series(self, user: CurrentUser, data: SeriesCreate) -> Series:
        series = Series(owner_writer_id=user.id, **data.model_dump())
        self.db.add(series)
        self.db.flush()
        record_audit(
            self.db,
            actor_id=user.id,
            action="series.create",
            entity_type="series",
            entity_id=series.id,
            metadata={"title": series.title},
        )
        return series

    def update_series(self, user: CurrentUser, series_id: uuid.UUID, data: SeriesUpdate) -> Series:
        series = self.get_series_for_user(user, series_id)
        changes = data.model_dump(exclude_unset=True, exclude_none=True)
        for key, value in changes.items():
            setattr(series, key, value)
        record_audit(
            self.db,
            actor_id=user.id,
            action="series.update",
            entity_type="series",
            entity_id=series.id,
            metadata={"fields": sorted(changes)},
        )
        return series

    def admin_update_series(
        self, admin: CurrentUser, series_id: uuid.UUID, data: AdminSeriesUpdate
    ) -> Series:
        series = self._series(series_id)
        changes = data.model_dump(exclude_unset=True, exclude_none=True)
        changes.pop("is_ai_assisted", None)  # can only be true; nothing to change
        archived = changes.pop("archived", None)
        owner_id = changes.pop("owner_writer_id", None)
        if owner_id is not None:
            owner = lookup_user(self.db, owner_id)
            if owner is None or owner.role != Role.WRITER or owner.status != UserStatus.ACTIVE:
                raise ValidationFailed("New owner must be an active writer", code="invalid_owner")
            series.owner_writer_id = owner_id
        for key, value in changes.items():
            setattr(series, key, value)
        if archived is True:
            series.status = SeriesStatus.ARCHIVED
        elif archived is False and series.status == SeriesStatus.ARCHIVED:
            series.status = SeriesStatus.PUBLISHED if series.published_at else SeriesStatus.DRAFT
        record_audit(
            self.db,
            actor_id=admin.id,
            action="series.admin_update",
            entity_type="series",
            entity_id=series.id,
            metadata={
                "fields": sorted([*changes, *(["owner_writer_id"] if owner_id else [])]),
                "archived": archived,
            },
        )
        return series

    def set_status(self, series_id: uuid.UUID, status: SeriesStatus) -> Series:
        """Used by the publishing flow (plan 08)."""
        series = self._series(series_id)
        series.status = status
        if status == SeriesStatus.PUBLISHED and series.published_at is None:
            series.published_at = datetime.now(UTC)
        return series

    def increment_play_count(self, series_id: uuid.UUID, plays: int) -> None:
        self.db.execute(
            update(Series)
            .where(Series.id == series_id)
            .values(play_count=Series.play_count + plays)
        )

    # Covers ----------------------------------------------------------------------------------

    def upload_cover(
        self, user: CurrentUser, series_id: uuid.UUID, data: bytes, declared_type: str | None
    ) -> Series:
        series = self.get_series_for_user(user, series_id)
        if len(data) > COVER_MAX_BYTES:
            raise ValidationFailed("Cover must be 5 MB or smaller", code="cover_too_large")
        content_type = _sniff_image(data)
        if content_type is None or (declared_type and declared_type not in COVER_TYPES):
            raise ValidationFailed("Cover must be a JPEG, PNG or WebP image", code="invalid_cover")
        key = f"covers/{series.id}/{uuid.uuid4().hex}.{COVER_TYPES[content_type]}"
        self.container.storage.put(key, data, content_type)
        self.db.execute(
            update(CoverAsset).where(CoverAsset.series_id == series.id).values(is_active=False)
        )
        self.db.add(CoverAsset(series_id=series.id, storage_key=key, content_type=content_type))
        record_audit(
            self.db,
            actor_id=user.id,
            action="series.cover_upload",
            entity_type="series",
            entity_id=series.id,
        )
        self.db.flush()
        return series

    def cover_urls(self, series_ids: list[uuid.UUID]) -> dict[uuid.UUID, str]:
        if not series_ids:
            return {}
        rows = self.db.execute(
            select(CoverAsset.series_id, CoverAsset.storage_key).where(
                CoverAsset.series_id.in_(series_ids), CoverAsset.is_active.is_(True)
            )
        ).all()
        storage = self.container.storage
        return {sid: storage.signed_url(key, COVER_URL_TTL_SECONDS) for sid, key in rows}

    def studio_out(self, series: Series) -> SeriesOut:
        out = SeriesOut.model_validate(series)
        out.cover_url = self.cover_urls([series.id]).get(series.id)
        return out

    def studio_out_many(self, rows: list[Series]) -> list[SeriesOut]:
        covers = self.cover_urls([s.id for s in rows])
        result = []
        for series in rows:
            out = SeriesOut.model_validate(series)
            out.cover_url = covers.get(series.id)
            result.append(out)
        return result

    # Listener views --------------------------------------------------------------------------

    def _listener_out(self, rows: list[Series]) -> list[ListenerSeriesOut]:
        covers = self.cover_urls([s.id for s in rows])
        return [
            ListenerSeriesOut(
                id=s.id,
                title=s.title,
                premise=s.premise,
                language=s.language,
                tone=s.tone,
                themes=list(s.themes),
                free_episode_count=s.free_episode_count,
                play_count=s.play_count,
                cover_url=covers.get(s.id),
                published_at=s.published_at,
            )
            for s in rows
        ]

    def get_listener_series(self, series_id: uuid.UUID) -> ListenerSeriesOut:
        """Published series by id. Archived series stay readable by id for existing listeners."""
        series = self.db.get(Series, series_id)
        if series is None or series.status not in (SeriesStatus.PUBLISHED, SeriesStatus.ARCHIVED):
            raise NotFound("Series not found")
        return self._listener_out([series])[0]

    def get_published_series(self, series_id: uuid.UUID) -> Series | None:
        series = self.db.get(Series, series_id)
        return series if series and series.status in LISTENER_VISIBLE else None

    def search(self, q: str, params: PageParams) -> tuple[list[ListenerSeriesOut], int]:
        stmt = (
            select(Series)
            .where(
                Series.status.in_(LISTENER_VISIBLE),
                Series.title.ilike(f"%{_escape_like(q.strip())}%", escape="\\"),
            )
            .order_by(Series.play_count.desc(), Series.title)
        )
        total = self.db.scalar(select(func.count()).select_from(stmt.order_by(None).subquery()))
        rows = list(self.db.scalars(stmt.limit(params.limit).offset(params.offset)))
        return self._listener_out(rows), total or 0

    def listener_shelves(
        self, params: PageParams, items_per_shelf: int
    ) -> tuple[list[ListenerShelfOut], int]:
        """Shelves in admin order with their published series; empty shelves are skipped."""
        visible = (
            select(ShelfItem.shelf_id)
            .join(Series, Series.id == ShelfItem.series_id)
            .where(Series.status.in_(LISTENER_VISIBLE))
        )
        stmt = select(Shelf).where(Shelf.id.in_(visible)).order_by(Shelf.position, Shelf.title)
        total = self.db.scalar(select(func.count()).select_from(stmt.order_by(None).subquery()))
        shelves = list(self.db.scalars(stmt.limit(params.limit).offset(params.offset)))
        result = []
        for shelf in shelves:
            series = list(
                self.db.scalars(
                    select(Series)
                    .join(ShelfItem, ShelfItem.series_id == Series.id)
                    .where(ShelfItem.shelf_id == shelf.id, Series.status.in_(LISTENER_VISIBLE))
                    .order_by(ShelfItem.position)
                    .limit(items_per_shelf)
                )
            )
            result.append(
                ListenerShelfOut(
                    id=shelf.id,
                    title=shelf.title,
                    kind=shelf.kind,
                    series=self._listener_out(series),
                )
            )
        return result, total or 0

    # Shelves (admin) -------------------------------------------------------------------------

    def _shelf(self, shelf_id: uuid.UUID) -> Shelf:
        shelf = self.db.get(Shelf, shelf_id)
        if shelf is None:
            raise NotFound("Shelf not found")
        return shelf

    def admin_shelf_out(self, shelf: Shelf) -> AdminShelfOut:
        series_ids = list(
            self.db.scalars(
                select(ShelfItem.series_id)
                .where(ShelfItem.shelf_id == shelf.id)
                .order_by(ShelfItem.position)
            )
        )
        return AdminShelfOut(
            id=shelf.id,
            title=shelf.title,
            kind=shelf.kind,
            position=shelf.position,
            series_ids=series_ids,
        )

    def list_admin_shelves(self) -> list[AdminShelfOut]:
        shelves = self.db.scalars(select(Shelf).order_by(Shelf.position, Shelf.title))
        return [self.admin_shelf_out(s) for s in shelves]

    def create_shelf(self, admin: CurrentUser, data: ShelfCreate) -> Shelf:
        last = self.db.scalar(select(func.max(Shelf.position)))
        shelf = Shelf(title=data.title, kind=data.kind, position=(last or 0) + 1)
        self.db.add(shelf)
        self.db.flush()
        record_audit(
            self.db,
            actor_id=admin.id,
            action="shelf.create",
            entity_type="shelf",
            entity_id=shelf.id,
        )
        return shelf

    def update_shelf(self, admin: CurrentUser, shelf_id: uuid.UUID, data: ShelfUpdate) -> Shelf:
        shelf = self._shelf(shelf_id)
        for key, value in data.model_dump(exclude_unset=True, exclude_none=True).items():
            setattr(shelf, key, value)
        record_audit(
            self.db,
            actor_id=admin.id,
            action="shelf.update",
            entity_type="shelf",
            entity_id=shelf.id,
        )
        return shelf

    def delete_shelf(self, admin: CurrentUser, shelf_id: uuid.UUID) -> None:
        shelf = self._shelf(shelf_id)
        self.db.delete(shelf)
        record_audit(
            self.db,
            actor_id=admin.id,
            action="shelf.delete",
            entity_type="shelf",
            entity_id=shelf_id,
        )

    def reorder_shelves(self, admin: CurrentUser, shelf_ids: list[uuid.UUID]) -> None:
        existing = set(self.db.scalars(select(Shelf.id)))
        if set(shelf_ids) != existing or len(shelf_ids) != len(existing):
            raise ValidationFailed("List every shelf exactly once", code="invalid_shelf_order")
        for position, shelf_id in enumerate(shelf_ids, start=1):
            self.db.execute(update(Shelf).where(Shelf.id == shelf_id).values(position=position))
        record_audit(self.db, actor_id=admin.id, action="shelf.reorder", entity_type="shelf")

    def set_shelf_items(
        self, admin: CurrentUser, shelf_id: uuid.UUID, series_ids: list[uuid.UUID]
    ) -> Shelf:
        shelf = self._shelf(shelf_id)
        if len(set(series_ids)) != len(series_ids):
            raise ValidationFailed("A series can appear once per shelf", code="duplicate_series")
        found = set(self.db.scalars(select(Series.id).where(Series.id.in_(series_ids))))
        missing = [str(sid) for sid in series_ids if sid not in found]
        if missing:
            raise ValidationFailed(
                "Unknown series", code="unknown_series", details={"ids": missing}
            )
        self.db.execute(delete(ShelfItem).where(ShelfItem.shelf_id == shelf.id))
        for position, series_id in enumerate(series_ids, start=1):
            self.db.add(ShelfItem(shelf_id=shelf.id, series_id=series_id, position=position))
        record_audit(
            self.db,
            actor_id=admin.id,
            action="shelf.set_items",
            entity_type="shelf",
            entity_id=shelf.id,
            metadata={"count": len(series_ids)},
        )
        self.db.flush()
        return shelf
