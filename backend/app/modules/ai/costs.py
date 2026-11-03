"""Cost reporting over ai_usage rows."""

import uuid
from datetime import UTC, date, datetime, time, timedelta
from decimal import Decimal
from typing import TYPE_CHECKING, Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.modules.ai.models import AIUsage, SeriesBudget
from app.modules.ai.schemas import (
    AdminCostsOut,
    BudgetOut,
    CostRow,
    CostSummary,
    EpisodeCost,
    PurposeCost,
    SeriesCostOut,
)
from app.modules.catalog import CatalogService
from app.modules.identity import CurrentUser
from app.modules.writing import EpisodeService
from app.shared.errors import ValidationFailed

if TYPE_CHECKING:
    from app.container import Container

ZERO = Decimal(0)
_SUMS = (
    func.coalesce(func.sum(AIUsage.cost_usd), 0),
    func.coalesce(func.sum(AIUsage.input_tokens), 0),
    func.coalesce(func.sum(AIUsage.output_tokens), 0),
    func.coalesce(func.sum(AIUsage.embedding_tokens), 0),
    func.coalesce(func.sum(AIUsage.tts_characters), 0),
)


class CostService:
    def __init__(self, db: Session, container: "Container") -> None:
        self.db = db
        self.catalog = CatalogService(db, container)
        self.episodes = EpisodeService(db, container)

    def _summary(self, *where: Any) -> CostSummary:
        cost, inp, out, emb, tts = self.db.execute(select(*_SUMS).where(*where)).one()
        by_purpose = [
            PurposeCost(purpose=purpose, cost_usd=value)
            for purpose, value in self.db.execute(
                select(AIUsage.purpose, func.sum(AIUsage.cost_usd))
                .where(*where)
                .group_by(AIUsage.purpose)
                .order_by(AIUsage.purpose)
            )
        ]
        return CostSummary(
            total_usd=Decimal(cost),
            input_tokens=inp,
            output_tokens=out,
            embedding_tokens=emb,
            tts_characters=tts,
            by_purpose=by_purpose,
        )

    def run_cost(self, run_id: uuid.UUID) -> Decimal:
        value = self.db.scalar(
            select(func.coalesce(func.sum(AIUsage.cost_usd), 0)).where(
                AIUsage.workflow_run_id == run_id
            )
        )
        return Decimal(value or 0)

    def episode_costs(self, user: CurrentUser, episode_id: uuid.UUID) -> CostSummary:
        self.episodes.get_for_user(user, episode_id)
        return self._summary(AIUsage.episode_id == episode_id)

    def budget(self, series_id: uuid.UUID, total: Decimal) -> BudgetOut:
        limit = self.db.scalar(
            select(SeriesBudget.soft_limit_usd).where(SeriesBudget.series_id == series_id)
        )
        return BudgetOut(soft_limit_usd=limit, over_budget=limit is not None and total > limit)

    def series_costs(self, user: CurrentUser, series_id: uuid.UUID) -> SeriesCostOut:
        episodes = self.episodes.list_for_series(user, series_id)  # also checks access
        summary = self._summary(AIUsage.series_id == series_id)
        per_episode = dict(
            self.db.execute(
                select(AIUsage.episode_id, func.sum(AIUsage.cost_usd))
                .where(AIUsage.series_id == series_id)
                .group_by(AIUsage.episode_id)
            ).all()
        )
        return SeriesCostOut(
            summary=summary,
            episodes=[
                EpisodeCost(
                    episode_id=e.id,
                    number=e.number,
                    title=e.title,
                    cost_usd=per_episode.get(e.id, ZERO),
                )
                for e in episodes
            ],
            budget=self.budget(series_id, summary.total_usd),
        )

    def set_budget(self, series_id: uuid.UUID, limit: Decimal | None) -> BudgetOut:
        self.catalog.get_series(series_id)
        row = self.db.get(SeriesBudget, series_id)
        if limit is None:
            if row:
                self.db.delete(row)
        elif row:
            row.soft_limit_usd = limit
        else:
            self.db.add(SeriesBudget(series_id=series_id, soft_limit_usd=limit))
        self.db.flush()
        total = self._summary(AIUsage.series_id == series_id).total_usd
        return self.budget(series_id, total)

    def admin_costs(self, start: date | None, end: date | None, group_by: str) -> AdminCostsOut:
        columns = {
            "series": AIUsage.series_id,
            "episode": AIUsage.episode_id,
            "purpose": AIUsage.purpose,
            "model": AIUsage.model,
        }
        if group_by not in columns:
            raise ValidationFailed("Unknown grouping", code="invalid_group_by")
        where = []
        if start:
            where.append(AIUsage.created_at >= datetime.combine(start, time.min, UTC))
        if end:
            where.append(
                AIUsage.created_at < datetime.combine(end + timedelta(days=1), time.min, UTC)
            )
        column = columns[group_by]
        rows = self.db.execute(
            select(column, *_SUMS).where(*where).group_by(column).order_by(_SUMS[0].desc())
        ).all()
        result = [
            CostRow(
                key=str(key) if key is not None else "",
                label=self._label(group_by, key),
                cost_usd=Decimal(cost),
                input_tokens=inp,
                output_tokens=out,
                embedding_tokens=emb,
                tts_characters=tts,
            )
            for key, cost, inp, out, emb, tts in rows
        ]
        return AdminCostsOut(
            from_date=start,
            to_date=end,
            group_by=group_by,
            total_usd=sum((r.cost_usd for r in result), ZERO),
            rows=result,
        )

    def _label(self, group_by: str, key: Any) -> str:
        if key is None:
            return "(none)"
        if group_by == "series":
            return self.catalog.get_series(key).title
        if group_by == "episode":
            episode = self.episodes.get(key)
            series = self.catalog.get_series(episode.series_id)
            return f"{series.title} · {episode.number}. {episode.title}".rstrip(". ")
        return str(key)
