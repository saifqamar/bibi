import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.modules.ai.models import RunStatus


class RunOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    workflow: str
    episode_id: uuid.UUID | None
    series_id: uuid.UUID | None
    status: RunStatus
    current_step: str
    interrupt_payload: dict[str, Any] | None
    error: str | None
    request_id: str | None
    started_at: datetime | None
    finished_at: datetime | None
    created_at: datetime
    cost_usd: Decimal = Decimal(0)


class PurposeCost(BaseModel):
    purpose: str
    cost_usd: Decimal


class CostSummary(BaseModel):
    total_usd: Decimal
    input_tokens: int
    output_tokens: int
    embedding_tokens: int
    tts_characters: int
    by_purpose: list[PurposeCost]


class EpisodeCost(BaseModel):
    episode_id: uuid.UUID
    number: int
    title: str
    cost_usd: Decimal


class BudgetOut(BaseModel):
    soft_limit_usd: Decimal | None
    over_budget: bool


class SeriesCostOut(BaseModel):
    summary: CostSummary
    episodes: list[EpisodeCost]
    budget: BudgetOut


class CostRow(BaseModel):
    key: str
    label: str
    cost_usd: Decimal
    input_tokens: int
    output_tokens: int
    embedding_tokens: int
    tts_characters: int


class AdminCostsOut(BaseModel):
    from_date: date | None
    to_date: date | None
    group_by: str
    total_usd: Decimal
    rows: list[CostRow]
    # Needs completed listening minutes (plan 12); null until then.
    cost_per_finished_minute_usd: Decimal | None = None


class BudgetIn(BaseModel):
    soft_limit_usd: Decimal | None = Field(default=None, ge=0, le=1_000_000)
