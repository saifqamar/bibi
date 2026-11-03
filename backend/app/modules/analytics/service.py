"""Aggregates listening events into daily stats, drop-off minutes and activity days, and turns
them into the dashboard metrics."""

import uuid
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal
from typing import TYPE_CHECKING, Any

from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.modules.analytics.models import (
    AnalyticsWatermark,
    EpisodeDailyStats,
    EpisodeDropoffMinute,
    UserActivityDay,
)
from app.modules.catalog import CatalogService
from app.modules.listening import ListeningService
from app.modules.writing import EpisodeService
from app.shared.jobs import job

if TYPE_CHECKING:
    from app.container import Container

AGGREGATE_JOB = "analytics.aggregate"
WATERMARK = "listening_events"
BATCH = 5000
RETURN_DAYS = (1, 7, 30)


def _rate(numerator: int, denominator: int) -> float | None:
    return round(numerator / denominator, 4) if denominator else None


class AnalyticsService:
    def __init__(self, db: Session, container: "Container") -> None:
        self.db = db
        self.container = container

    # Aggregation -----------------------------------------------------------------------------

    def aggregate(self) -> int:
        """Processes events after the watermark. Safe to run repeatedly; returns events done."""
        mark = self.db.get(AnalyticsWatermark, WATERMARK)
        if mark is None:
            mark = AnalyticsWatermark(name=WATERMARK, last_seq=0)
            self.db.add(mark)
            self.db.flush()
        events = ListeningService(self.db, self.container).events_after(mark.last_seq, BATCH)
        plays: dict[uuid.UUID, int] = {}
        for event in events:
            day = event.client_ts.astimezone(UTC).date()
            if event.event_type in ("play_started", "play_completed", "next_episode_started"):
                column = {
                    "play_started": "plays",
                    "play_completed": "completions",
                    "next_episode_started": "next_episode_starts",
                }[event.event_type]
                self.db.execute(
                    insert(EpisodeDailyStats)
                    .values(
                        episode_id=event.episode_id,
                        day=day,
                        series_id=event.series_id,
                        **{"plays": 0, "completions": 0, "next_episode_starts": 0, column: 1},
                    )
                    .on_conflict_do_update(
                        index_elements=["episode_id", "day"],
                        set_={column: getattr(EpisodeDailyStats, column) + 1},
                    )
                )
                if event.event_type == "play_started":
                    plays[event.series_id] = plays.get(event.series_id, 0) + 1
            elif event.event_type == "drop_off":
                minute = int(event.position_seconds // 60)
                self.db.execute(
                    insert(EpisodeDropoffMinute)
                    .values(episode_id=event.episode_id, minute=minute, count=1)
                    .on_conflict_do_update(
                        index_elements=["episode_id", "minute"],
                        set_={"count": EpisodeDropoffMinute.count + 1},
                    )
                )
            if event.user_id is not None:
                self.db.execute(
                    insert(UserActivityDay)
                    .values(user_id=event.user_id, day=day)
                    .on_conflict_do_nothing()
                )
            mark.last_seq = event.seq
        catalog = CatalogService(self.db, self.container)
        for series_id, count in plays.items():
            catalog.increment_play_count(series_id, count)
        self.db.flush()
        return len(events)

    def cleanup(self, *, retention_days: int) -> int:
        """Deletes raw events past retention once they have been aggregated."""
        cutoff = datetime.now(UTC) - timedelta(days=retention_days)
        mark = self.db.get(AnalyticsWatermark, WATERMARK)
        return ListeningService(self.db, self.container).delete_events_before(
            cutoff, max_seq=mark.last_seq if mark else 0
        )

    # Metrics ---------------------------------------------------------------------------------

    def _totals(self, *where: Any) -> dict[str, Any]:
        plays, completions, nexts = self.db.execute(
            select(
                func.coalesce(func.sum(EpisodeDailyStats.plays), 0),
                func.coalesce(func.sum(EpisodeDailyStats.completions), 0),
                func.coalesce(func.sum(EpisodeDailyStats.next_episode_starts), 0),
            ).where(*where)
        ).one()
        return {
            "plays": plays,
            "completions": completions,
            "next_episode_starts": nexts,
            "completion_rate": _rate(completions, plays),
            "next_episode_rate": _rate(nexts, completions),
        }

    def _range(self, start: date | None, end: date | None) -> list[Any]:
        where = []
        if start:
            where.append(EpisodeDailyStats.day >= start)
        if end:
            where.append(EpisodeDailyStats.day <= end)
        return where

    def overview(self, start: date | None, end: date | None) -> dict[str, Any]:
        return {**self._totals(*self._range(start, end)), "retention": self.retention()}

    def series_stats(
        self, series_id: uuid.UUID, start: date | None, end: date | None
    ) -> dict[str, Any]:
        episodes = EpisodeService(self.db, self.container).all_for_series(series_id)
        rows = []
        for episode in episodes:
            totals = self._totals(
                EpisodeDailyStats.episode_id == episode.id, *self._range(start, end)
            )
            rows.append(
                {
                    "episode_id": str(episode.id),
                    "number": episode.number,
                    "title": episode.title,
                    **totals,
                }
            )
        return {
            **self._totals(EpisodeDailyStats.series_id == series_id, *self._range(start, end)),
            "episodes": rows,
        }

    def episode_stats(
        self, episode_id: uuid.UUID, start: date | None, end: date | None
    ) -> dict[str, Any]:
        episode = EpisodeService(self.db, self.container).get(episode_id)
        dropoff = [
            {"minute": minute, "count": count}
            for minute, count in self.db.execute(
                select(EpisodeDropoffMinute.minute, EpisodeDropoffMinute.count)
                .where(EpisodeDropoffMinute.episode_id == episode_id)
                .order_by(EpisodeDropoffMinute.minute)
            )
        ]
        duration = episode.published_duration_seconds
        return {
            "episode_id": str(episode_id),
            "number": episode.number,
            "title": episode.title,
            "duration_minutes": float(duration / 60) if duration else None,
            **self._totals(EpisodeDailyStats.episode_id == episode_id, *self._range(start, end)),
            "dropoff": dropoff,
        }

    def retention(self, today: date | None = None) -> dict[str, float | None]:
        """Share of listeners, by first listening day, who listen again exactly N days later."""
        today = today or datetime.now(UTC).date()
        first = (
            select(UserActivityDay.user_id, func.min(UserActivityDay.day).label("first_day"))
            .group_by(UserActivityDay.user_id)
            .subquery()
        )
        result: dict[str, float | None] = {}
        for days in RETURN_DAYS:
            eligible = (
                self.db.scalar(
                    select(func.count()).select_from(first).where(first.c.first_day + days <= today)
                )
                or 0
            )
            returned = (
                self.db.scalar(
                    select(func.count())
                    .select_from(first)
                    .join(UserActivityDay, UserActivityDay.user_id == first.c.user_id)
                    .where(
                        UserActivityDay.day == first.c.first_day + days,
                        first.c.first_day + days <= today,
                    )
                )
                or 0
            )
            result[f"d{days}"] = _rate(returned, eligible)
        return result

    def finished_minutes(self, start: date | None, end: date | None) -> Decimal:
        """Completed listening minutes (completions x episode length), for cost per minute."""
        episodes = EpisodeService(self.db, self.container)
        total = Decimal(0)
        rows = self.db.execute(
            select(EpisodeDailyStats.episode_id, func.sum(EpisodeDailyStats.completions))
            .where(*self._range(start, end))
            .group_by(EpisodeDailyStats.episode_id)
        ).all()
        for episode_id, completions in rows:
            duration = episodes.get(episode_id).published_duration_seconds or Decimal(0)
            total += duration / 60 * completions
        return total


@job(AGGREGATE_JOB)
def aggregate_job(container: Any) -> int:
    processed = 0
    with container.db.session() as db:
        service = AnalyticsService(db, container)
        while True:
            count = service.aggregate()
            db.commit()
            processed += count
            if count < BATCH:
                break
        service.cleanup(retention_days=container.settings.listening_event_retention_days)
        db.commit()
    return processed
