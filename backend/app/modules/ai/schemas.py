import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Any, Literal

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


class IssueOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    episode_id: uuid.UUID
    workflow_run_id: uuid.UUID | None
    draft_version: int
    severity: str
    type: str
    description: str
    quote: str
    source_ref: dict[str, Any]
    status: str
    resolution_note: str
    resolved_at: datetime | None
    created_at: datetime


class ResolveIssueIn(BaseModel):
    status: Literal["fixed", "intentional"]
    note: str = Field(default="", max_length=2000)


class IssueCanonIn(BaseModel):
    """Turn an issue into a canon change proposal the writer then accepts or rejects."""

    entity_type: Literal[
        "characters", "relationships", "locations", "world-rules", "timeline", "plot-threads"
    ]
    op: Literal["create", "update", "delete"]
    entity_id: uuid.UUID | None = None
    payload: dict[str, Any] = Field(default_factory=dict)
