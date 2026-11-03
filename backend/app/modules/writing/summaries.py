"""Episode summaries with embeddings, used to retrieve earlier story while drafting."""

import uuid
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.writing.models import Episode, EpisodeSummary


@dataclass(frozen=True)
class SummaryHit:
    episode_id: uuid.UUID
    number: int
    title: str
    summary: str


class SummaryService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def upsert(
        self,
        episode_id: uuid.UUID,
        series_id: uuid.UUID,
        draft_version: int,
        summary: str,
        embedding: list[float],
    ) -> EpisodeSummary:
        row = self.db.scalar(select(EpisodeSummary).where(EpisodeSummary.episode_id == episode_id))
        if row is None:
            row = EpisodeSummary(episode_id=episode_id, series_id=series_id)
            self.db.add(row)
        row.draft_version = draft_version
        row.summary = summary
        row.embedding = embedding
        self.db.flush()
        return row

    def _hits(self, stmt: object) -> list[SummaryHit]:
        return [
            SummaryHit(episode_id=e.id, number=e.number, title=e.title, summary=s.summary)
            for s, e in self.db.execute(stmt).all()  # type: ignore[call-overload]
        ]

    def recent_before(self, series_id: uuid.UUID, number: int, limit: int) -> list[SummaryHit]:
        """The episodes immediately before ``number``, oldest first."""
        stmt = (
            select(EpisodeSummary, Episode)
            .join(Episode, Episode.id == EpisodeSummary.episode_id)
            .where(EpisodeSummary.series_id == series_id, Episode.number < number)
            .order_by(Episode.number.desc())
            .limit(limit)
        )
        return list(reversed(self._hits(stmt)))

    def similar(
        self,
        series_id: uuid.UUID,
        embedding: list[float],
        *,
        before_number: int,
        limit: int,
    ) -> list[SummaryHit]:
        """Earlier episodes whose summaries are closest (cosine distance) to ``embedding``."""
        stmt = (
            select(EpisodeSummary, Episode)
            .join(Episode, Episode.id == EpisodeSummary.episode_id)
            .where(EpisodeSummary.series_id == series_id, Episode.number < before_number)
            .order_by(EpisodeSummary.embedding.cosine_distance(embedding))
            .limit(limit)
        )
        return self._hits(stmt)
