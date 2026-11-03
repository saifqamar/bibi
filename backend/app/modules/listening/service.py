"""Listening events, playback progress and downloads."""

import uuid
from datetime import UTC, datetime
from decimal import Decimal
from typing import TYPE_CHECKING, get_args

from sqlalchemy import delete, select, update
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.modules.catalog import CatalogService
from app.modules.identity import CurrentUser
from app.modules.listening.models import Download, ListeningEvent, PlaybackProgress
from app.modules.listening.schemas import (
    DownloadOut,
    EventBatchOut,
    EventIn,
    EventType,
    ProgressIn,
    ProgressOut,
    RejectedEvent,
)
from app.modules.writing import Episode, EpisodeService
from app.shared.errors import NotFound
from app.shared.events import subscribe

if TYPE_CHECKING:
    from app.container import Container

COMPLETED_SHARE = Decimal("0.95")  # [OPEN] completion threshold; spec default 95%
VALID_TYPES = set(get_args(EventType))


class ListeningService:
    def __init__(self, db: Session, container: "Container") -> None:
        self.db = db
        self.container = container
        self.episodes = EpisodeService(db, container)

    def _live(self, episode_id: uuid.UUID) -> Episode | None:
        try:
            episode = self.episodes.get(episode_id)
        except NotFound:
            return None
        return episode if episode.published_audio_id is not None else None

    # Events ----------------------------------------------------------------------------------

    def ingest(self, user: CurrentUser, events: list[EventIn]) -> EventBatchOut:
        accepted = duplicates = 0
        rejected: list[RejectedEvent] = []
        live: dict[uuid.UUID, Episode | None] = {}
        for index, event in enumerate(events):
            if event.type not in VALID_TYPES:
                rejected.append(RejectedEvent(index=index, code="unknown_event_type"))
                continue
            if event.episode_id not in live:
                live[event.episode_id] = self._live(event.episode_id)
            episode = live[event.episode_id]
            if episode is None:
                rejected.append(RejectedEvent(index=index, code="episode_not_published"))
                continue
            result = self.db.execute(
                insert(ListeningEvent)
                .values(
                    id=uuid.uuid4(),
                    client_event_id=event.client_event_id,
                    user_id=user.id,
                    episode_id=event.episode_id,
                    series_id=episode.series_id,
                    event_type=event.type,
                    position_seconds=event.position_seconds,
                    to_episode_id=event.to_episode_id,
                    session_id=event.session_id,
                    device=event.device,
                    client_ts=event.client_ts,
                )
                .on_conflict_do_nothing(constraint="uq_listening_events_client_id")
                .returning(ListeningEvent.id)
            )
            # RETURNING yields a row only when the event was new (rowcount is unreliable here).
            if result.first() is not None:
                accepted += 1
            else:
                duplicates += 1
            if event.type == "play_completed":
                self._mark_completed(user.id, episode, event)
        return EventBatchOut(accepted=accepted, duplicates=duplicates, rejected=rejected)

    def _mark_completed(self, user_id: uuid.UUID, episode: Episode, event: EventIn) -> None:
        self._upsert_progress(
            user_id, episode, event.position_seconds, event.client_ts, completed=True
        )

    def events_after(self, seq: int, limit: int) -> list[ListeningEvent]:
        """For the analytics aggregation (system read)."""
        return list(
            self.db.scalars(
                select(ListeningEvent)
                .where(ListeningEvent.seq > seq)
                .order_by(ListeningEvent.seq)
                .limit(limit)
            )
        )

    def delete_events_before(self, cutoff: datetime, *, max_seq: int) -> int:
        result = self.db.execute(
            delete(ListeningEvent).where(
                ListeningEvent.received_at < cutoff, ListeningEvent.seq <= max_seq
            )
        )
        return int(result.rowcount or 0)  # type: ignore[attr-defined]

    # Progress --------------------------------------------------------------------------------

    def _upsert_progress(
        self,
        user_id: uuid.UUID,
        episode: Episode,
        position: Decimal,
        client_ts: datetime,
        *,
        completed: bool,
    ) -> PlaybackProgress:
        episode_id = episode.id
        duration = episode.published_duration_seconds
        done = completed or bool(duration and position >= duration * COMPLETED_SHARE)
        row = self.db.get(PlaybackProgress, (user_id, episode_id))
        if row is None:
            row = PlaybackProgress(
                user_id=user_id,
                episode_id=episode_id,
                series_id=episode.series_id,
                position_seconds=position,
                completed=done,
                client_ts=client_ts,
            )
            self.db.add(row)
        elif client_ts >= row.client_ts:  # the latest client timestamp wins
            row.position_seconds, row.client_ts = position, client_ts
            row.completed = row.completed or done
        self.db.flush()
        return row

    def put_progress(
        self, user: CurrentUser, episode_id: uuid.UUID, data: ProgressIn
    ) -> ProgressOut:
        episode = self._live(episode_id)
        if episode is None:
            raise NotFound("Episode not found")
        row = self._upsert_progress(
            user.id, episode, data.position_seconds, data.client_ts, completed=data.completed
        )
        return self._progress_out(row)

    def _progress_out(self, row: PlaybackProgress) -> ProgressOut:
        episode = self.episodes.get(row.episode_id)
        series = CatalogService(self.db, self.container).get_series(row.series_id)
        return ProgressOut(
            episode_id=row.episode_id,
            series_id=row.series_id,
            series_title=series.title,
            episode_number=episode.number,
            episode_title=episode.title,
            position_seconds=row.position_seconds,
            duration_seconds=episode.published_duration_seconds,
            completed=row.completed,
            updated_at=row.updated_at,
        )

    def progress(self, user: CurrentUser, limit: int) -> list[ProgressOut]:
        """Most recent first; episodes that are no longer published are left out."""
        rows = self.db.scalars(
            select(PlaybackProgress)
            .where(PlaybackProgress.user_id == user.id)
            .order_by(PlaybackProgress.updated_at.desc())
            .limit(limit)
        )
        return [self._progress_out(r) for r in rows if self._live(r.episode_id) is not None]

    # Downloads -------------------------------------------------------------------------------

    def add_download(self, user: CurrentUser, episode_id: uuid.UUID) -> DownloadOut:
        if self._live(episode_id) is None:
            raise NotFound("Episode not found")
        row = self.db.get(Download, (user.id, episode_id))
        now = datetime.now(UTC)
        if row is None:
            row = Download(user_id=user.id, episode_id=episode_id, downloaded_at=now)
            self.db.add(row)
        else:
            row.downloaded_at, row.removed_at = now, None
        self.db.flush()
        return DownloadOut(episode_id=episode_id, downloaded_at=row.downloaded_at, available=True)

    def remove_download(self, user: CurrentUser, episode_id: uuid.UUID) -> None:
        self.db.execute(
            update(Download)
            .where(Download.user_id == user.id, Download.episode_id == episode_id)
            .values(removed_at=datetime.now(UTC))
        )

    def downloads(self, user: CurrentUser) -> list[DownloadOut]:
        rows = self.db.scalars(
            select(Download)
            .where(Download.user_id == user.id, Download.removed_at.is_(None))
            .order_by(Download.downloaded_at.desc())
        )
        return [
            DownloadOut(
                episode_id=r.episode_id,
                downloaded_at=r.downloaded_at,
                available=self._live(r.episode_id) is not None,
            )
            for r in rows
        ]


@subscribe("user_deleted")
def _forget_listener(db: Session, user_id: uuid.UUID) -> None:
    """Account deletion: events are kept anonymised for aggregates; personal state is deleted."""
    db.execute(update(ListeningEvent).where(ListeningEvent.user_id == user_id).values(user_id=None))
    db.execute(delete(PlaybackProgress).where(PlaybackProgress.user_id == user_id))
    db.execute(delete(Download).where(Download.user_id == user_id))
