"""Review queue, decisions, publishing and writer notifications."""

import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

from app.modules.admin.models import ReviewItem, ReviewStatus, WriterNotification
from app.modules.admin.schemas import (
    NotificationOut,
    ReviewDetailOut,
    ReviewItemOut,
)
from app.modules.ai import ContinuityService, CostService
from app.modules.audio import AudioService
from app.modules.catalog import CatalogService, SeriesStatus
from app.modules.identity import CurrentUser, Role
from app.modules.writing import EpisodeService, EpisodeStatus, can_auto_publish
from app.shared.audit import record_audit
from app.shared.errors import Conflict, NotFound, ValidationFailed

if TYPE_CHECKING:
    from app.container import Container


def _now() -> datetime:
    return datetime.now(UTC)


class ReviewService:
    def __init__(self, db: Session, container: "Container") -> None:
        self.db = db
        self.container = container
        self.episodes = EpisodeService(db, container)
        self.catalog = CatalogService(db, container)
        self.audio = AudioService(db, container)

    # Notifications ---------------------------------------------------------------------------

    def notify(
        self, episode_id: uuid.UUID, kind: str, message: str, item: ReviewItem | None
    ) -> None:
        episode = self.episodes.get(episode_id)
        owner = self.catalog.get_series(episode.series_id).owner_writer_id
        if owner is None:
            return
        self.db.add(
            WriterNotification(
                user_id=owner,
                kind=kind,
                episode_id=episode_id,
                review_item_id=item.id if item else None,
                message=message,
            )
        )

    def notifications(self, user: CurrentUser, limit: int) -> tuple[list[NotificationOut], int]:
        stmt = (
            select(WriterNotification)
            .where(WriterNotification.user_id == user.id)
            .order_by(WriterNotification.read_at.is_not(None), WriterNotification.created_at.desc())
            .limit(limit)
        )
        unread = self.db.scalar(
            select(func.count())
            .select_from(WriterNotification)
            .where(WriterNotification.user_id == user.id, WriterNotification.read_at.is_(None))
        )
        return [NotificationOut.model_validate(n) for n in self.db.scalars(stmt)], unread or 0

    def mark_read(self, user: CurrentUser, notification_id: uuid.UUID) -> None:
        note = self.db.get(WriterNotification, notification_id)
        if note is None or note.user_id != user.id:
            raise NotFound("Notification not found")
        note.read_at = note.read_at or _now()

    # Submitting ------------------------------------------------------------------------------

    def submit(self, user: CurrentUser, episode_id: uuid.UUID) -> ReviewItem:
        episode = self.episodes.get_for_user(user, episode_id)
        if episode.status != EpisodeStatus.AUDIO_READY:
            raise Conflict("Produce the audio before submitting", code="audio_not_ready")
        if ContinuityService(self.db).open_errors(episode_id):
            raise Conflict(
                "Resolve continuity errors before submitting", code="continuity_errors_open"
            )
        if not self.audio.asset_matches_current_draft(episode_id):
            raise Conflict(
                "The text changed since the audio was made; re-render the audio",
                code="audio_out_of_date",
            )
        version, _ = self.episodes.current_text(episode_id)
        item = ReviewItem(
            episode_id=episode_id,
            draft_version=version or 0,
            audio_asset_id=episode.current_audio_id,
            submitted_by=user.id,
        )
        self.db.add(item)
        self.episodes.set_status(episode_id, EpisodeStatus.IN_REVIEW)
        series = self.catalog.get_series(episode.series_id)
        if series.status == SeriesStatus.DRAFT:
            self.catalog.set_status(series.id, SeriesStatus.IN_REVIEW)
        self.db.flush()
        record_audit(
            self.db,
            actor_id=user.id,
            action="review.submit",
            entity_type="episode",
            entity_id=episode_id,
            metadata={"review_item_id": str(item.id)},
        )
        # Trusted writers may later skip review ([OPEN]); the hook is always false today.
        if can_auto_publish(user.id) and user.role == Role.WRITER:
            self._approve(item, user, publish_now=True, comments="Auto-published")
        return item

    def reviews_for_episode(self, user: CurrentUser, episode_id: uuid.UUID) -> list[ReviewItemOut]:
        self.episodes.get_for_user(user, episode_id)
        items = self.db.scalars(
            select(ReviewItem)
            .where(ReviewItem.episode_id == episode_id)
            .order_by(ReviewItem.submitted_at.desc())
        )
        return [self.item_out(i) for i in items]

    # Queue and detail ------------------------------------------------------------------------

    def queue_query(
        self, *, series_id: uuid.UUID | None, writer_id: uuid.UUID | None
    ) -> Select[ReviewItem]:
        stmt = select(ReviewItem).where(ReviewItem.status == ReviewStatus.PENDING)
        if series_id or writer_id:
            series_ids = self.catalog.series_ids(owner_writer_id=writer_id, series_id=series_id)
            episode_ids = [e.id for sid in series_ids for e in self.episodes.all_for_series(sid)]
            stmt = stmt.where(ReviewItem.episode_id.in_(episode_ids))
        return stmt.order_by(ReviewItem.submitted_at)

    def item_out(self, item: ReviewItem) -> ReviewItemOut:
        episode = self.episodes.get(item.episode_id)
        series = self.catalog.get_series(episode.series_id)
        return ReviewItemOut(
            id=item.id,
            episode_id=episode.id,
            episode_number=episode.number,
            episode_title=episode.title,
            series_id=series.id,
            series_title=series.title,
            writer_id=series.owner_writer_id,
            draft_version=item.draft_version,
            status=item.status.value,
            comments=item.comments,
            submitted_at=item.submitted_at,
            decided_at=item.decided_at,
        )

    def get_item(self, item_id: uuid.UUID) -> ReviewItem:
        item = self.db.get(ReviewItem, item_id)
        if item is None:
            raise NotFound("Review item not found")
        return item

    def detail(self, admin: CurrentUser, item_id: uuid.UUID) -> ReviewDetailOut:
        item = self.get_item(item_id)
        episode = self.episodes.get(item.episode_id)
        text_draft = self.episodes.get_draft(admin, episode.id, item.draft_version)
        asset = self.audio.current_asset(episode.id)
        issues = ContinuityService(self.db).issues(episode.id)
        return ReviewDetailOut(
            item=self.item_out(item),
            episode_status=episode.status.value,
            is_live=episode.published_audio_id is not None,
            text=text_draft.text,
            audio=self.audio.asset_out(asset)
            if asset and asset.id == item.audio_asset_id
            else None,
            continuity=[
                {
                    "severity": i.severity.value,
                    "type": i.type,
                    "description": i.description,
                    "quote": i.quote,
                    "status": i.status.value,
                    "resolution_note": i.resolution_note,
                }
                for i in issues
            ],
            cost=CostService(self.db, self.container).episode_costs(admin, episode.id),
            versions=self.episodes.list_drafts(admin, episode.id),
        )

    # Decisions -------------------------------------------------------------------------------

    def _pending(self, item_id: uuid.UUID) -> ReviewItem:
        item = self.get_item(item_id)
        if item.status != ReviewStatus.PENDING:
            raise Conflict("This review was already decided", code="review_decided")
        return item

    def _decide(
        self, item: ReviewItem, admin: CurrentUser, status: ReviewStatus, comments: str
    ) -> None:
        item.status = status
        item.reviewer_id = admin.id
        item.comments = comments
        item.decided_at = _now()
        record_audit(
            self.db,
            actor_id=admin.id,
            action=f"review.{status.value}",
            entity_type="review_item",
            entity_id=item.id,
            metadata={"episode_id": str(item.episode_id), "comments": comments[:500]},
        )

    def _approve(
        self, item: ReviewItem, admin: CurrentUser, *, publish_now: bool, comments: str
    ) -> None:
        self._decide(item, admin, ReviewStatus.APPROVED, comments)
        self.episodes.set_status(item.episode_id, EpisodeStatus.APPROVED)
        self.notify(item.episode_id, "approved", "Your episode was approved.", item)
        if publish_now:
            self.publish(admin, item.episode_id)

    def approve(
        self, admin: CurrentUser, item_id: uuid.UUID, *, publish_now: bool, comments: str
    ) -> ReviewItem:
        item = self._pending(item_id)
        self._approve(item, admin, publish_now=publish_now, comments=comments)
        return item

    def request_changes(self, admin: CurrentUser, item_id: uuid.UUID, comments: str) -> ReviewItem:
        if not comments.strip():
            raise ValidationFailed("Say what should change", code="comments_required")
        item = self._pending(item_id)
        self._decide(item, admin, ReviewStatus.CHANGES_REQUESTED, comments)
        self.episodes.set_status(item.episode_id, EpisodeStatus.CHANGES_REQUESTED)
        self.notify(item.episode_id, "changes_requested", f"Changes requested: {comments}", item)
        self._settle_series(item.episode_id)
        return item

    def reject(self, admin: CurrentUser, item_id: uuid.UUID, reason: str) -> ReviewItem:
        if not reason.strip():
            raise ValidationFailed("Give a reason", code="reason_required")
        item = self._pending(item_id)
        self._decide(item, admin, ReviewStatus.REJECTED, reason)
        self.episodes.set_status(item.episode_id, EpisodeStatus.READY_FOR_AUDIO)
        self.notify(item.episode_id, "rejected", f"Rejected: {reason}", item)
        self._settle_series(item.episode_id)
        return item

    # Publishing ------------------------------------------------------------------------------

    def publish(self, admin: CurrentUser, episode_id: uuid.UUID) -> None:
        episode = self.episodes.get(episode_id)
        if episode.status != EpisodeStatus.APPROVED:
            raise Conflict("Only approved episodes can be published", code="not_approved")
        version, _ = self.episodes.current_text(episode_id)
        approved = self.db.scalar(
            select(ReviewItem).where(
                ReviewItem.episode_id == episode_id,
                ReviewItem.status == ReviewStatus.APPROVED,
                ReviewItem.draft_version == version,
                ReviewItem.audio_asset_id == episode.current_audio_id,
            )
        )
        if approved is None or episode.current_audio_id is None:
            raise Conflict(
                "The current text and audio have not been approved", code="approval_missing"
            )
        asset = self.audio.current_asset(episode_id)
        assert asset is not None
        self.episodes.mark_published(episode_id, asset.id, asset.duration_seconds)
        self.audio.schedule_sample(episode_id)
        series = self.catalog.get_series(episode.series_id)
        if series.status != SeriesStatus.ARCHIVED:
            self.catalog.set_status(series.id, SeriesStatus.PUBLISHED)
        record_audit(
            self.db,
            actor_id=admin.id,
            action="episode.publish",
            entity_type="episode",
            entity_id=episode_id,
        )
        self.notify(episode_id, "published", "Your episode is live for listeners.", approved)

    def unpublish(self, admin: CurrentUser, episode_id: uuid.UUID) -> None:
        episode = self.episodes.get(episode_id)
        if episode.published_audio_id is None:
            raise Conflict("The episode is not published", code="not_published")
        self.episodes.mark_unpublished(episode_id)
        self._settle_series(episode_id)
        record_audit(
            self.db,
            actor_id=admin.id,
            action="episode.unpublish",
            entity_type="episode",
            entity_id=episode_id,
        )
        self.notify(episode_id, "unpublished", "Your episode was taken offline.", None)

    def _settle_series(self, episode_id: uuid.UUID) -> None:
        """Keeps the series status in line with its episodes."""
        series = self.catalog.get_series(self.episodes.get(episode_id).series_id)
        if series.status == SeriesStatus.ARCHIVED:
            return
        if self.episodes.live_episodes(series.id):
            self.catalog.set_status(series.id, SeriesStatus.PUBLISHED)
            return
        pending = self.db.scalar(
            select(func.count())
            .select_from(ReviewItem)
            .where(
                ReviewItem.status == ReviewStatus.PENDING,
                ReviewItem.episode_id.in_([e.id for e in self.episodes.all_for_series(series.id)]),
            )
        )
        self.catalog.set_status(
            series.id, SeriesStatus.IN_REVIEW if pending else SeriesStatus.DRAFT
        )
