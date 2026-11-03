import uuid
from datetime import datetime
from decimal import Decimal
from enum import StrEnum
from typing import Any

from sqlalchemy import (
    BigInteger,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.db import Base, TimestampMixin, UUIDPrimaryKey


class RunStatus(StrEnum):
    QUEUED = "queued"
    RUNNING = "running"
    WAITING = "waiting"  # paused at an interrupt for the writer
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    CANCELLED = "cancelled"


TERMINAL = frozenset({RunStatus.SUCCEEDED, RunStatus.FAILED, RunStatus.CANCELLED})
ACTIVE = frozenset({RunStatus.QUEUED, RunStatus.RUNNING, RunStatus.WAITING})


class WorkflowRun(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "workflow_runs"
    __table_args__ = (Index("ix_workflow_runs_episode_workflow", "episode_id", "workflow"),)

    thread_id: Mapped[str] = mapped_column(String(120), index=True)
    workflow: Mapped[str] = mapped_column(String(40))
    episode_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("episodes.id", ondelete="CASCADE"), nullable=True
    )
    series_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("series.id", ondelete="CASCADE"), nullable=True, index=True
    )
    status: Mapped[RunStatus] = mapped_column(
        Enum(
            RunStatus,
            name="run_status",
            native_enum=False,
            create_constraint=True,
            length=20,
            values_callable=lambda e: [m.value for m in e],
        ),
        default=RunStatus.QUEUED,
    )
    current_step: Mapped[str] = mapped_column(String(60), default="")
    interrupt_payload: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    input: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    request_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    requested_by: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )


class WorkflowRunEvent(Base):
    """Progress events streamed to the Studio. The integer id is the stream cursor."""

    __tablename__ = "workflow_run_events"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    workflow_run_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workflow_runs.id", ondelete="CASCADE"), index=True
    )
    kind: Mapped[str] = mapped_column(String(30))  # status | step | interrupt | error | info
    step: Mapped[str] = mapped_column(String(60), default="")
    message: Mapped[str] = mapped_column(Text, default="")
    data: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class AIUsage(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "ai_usage"
    __table_args__ = (
        Index("ix_ai_usage_episode", "episode_id"),
        Index("ix_ai_usage_series_created", "series_id", "created_at"),
    )

    workflow_run_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("workflow_runs.id", ondelete="SET NULL"), nullable=True, index=True
    )
    episode_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("episodes.id", ondelete="SET NULL"), nullable=True
    )
    series_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("series.id", ondelete="SET NULL"), nullable=True
    )
    purpose: Mapped[str] = mapped_column(String(40))  # drafting | continuity | embedding | tts ...
    provider: Mapped[str] = mapped_column(String(40))
    model: Mapped[str] = mapped_column(String(80))
    input_tokens: Mapped[int] = mapped_column(Integer, default=0)
    output_tokens: Mapped[int] = mapped_column(Integer, default=0)
    embedding_tokens: Mapped[int] = mapped_column(Integer, default=0)
    tts_characters: Mapped[int] = mapped_column(Integer, default=0)
    cost_usd: Mapped[Decimal] = mapped_column(Numeric(12, 6), default=Decimal(0))


class AIPrice(UUIDPrimaryKey, TimestampMixin, Base):
    """USD per million units. The newest row with effective_from <= now applies."""

    __tablename__ = "ai_prices"
    __table_args__ = (
        UniqueConstraint("provider", "model", "unit", "effective_from", name="uq_ai_prices_key"),
    )

    provider: Mapped[str] = mapped_column(String(40))
    model: Mapped[str] = mapped_column(String(80))
    unit: Mapped[str] = mapped_column(String(30))  # input_token | output_token | ...
    usd_per_million: Mapped[Decimal] = mapped_column(Numeric(12, 4))
    effective_from: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class SeriesBudget(TimestampMixin, Base):
    __tablename__ = "series_budgets"

    series_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("series.id", ondelete="CASCADE"), primary_key=True
    )
    soft_limit_usd: Mapped[Decimal] = mapped_column(Numeric(12, 2))


class IssueSeverity(StrEnum):
    ERROR = "error"
    WARNING = "warning"


class IssueStatus(StrEnum):
    OPEN = "open"
    FIXED = "fixed"
    INTENTIONAL = "intentional"


ISSUE_TYPES = ("character_fact", "timeline", "world_rule", "plot_thread", "naming")


def _str_enum(enum_cls: type[StrEnum], name: str) -> Enum:
    return Enum(
        enum_cls,
        name=name,
        native_enum=False,
        create_constraint=True,
        length=20,
        values_callable=lambda e: [m.value for m in e],
    )


class ContinuityIssue(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "continuity_issues"
    __table_args__ = (Index("ix_continuity_issues_episode_status", "episode_id", "status"),)

    workflow_run_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("workflow_runs.id", ondelete="SET NULL"), nullable=True
    )
    episode_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("episodes.id", ondelete="CASCADE"))
    draft_version: Mapped[int] = mapped_column(Integer)
    severity: Mapped[IssueSeverity] = mapped_column(_str_enum(IssueSeverity, "issue_severity"))
    type: Mapped[str] = mapped_column(String(30))
    description: Mapped[str] = mapped_column(Text)
    quote: Mapped[str] = mapped_column(Text)
    source_ref: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
    status: Mapped[IssueStatus] = mapped_column(
        _str_enum(IssueStatus, "issue_status"), default=IssueStatus.OPEN
    )
    resolution_note: Mapped[str] = mapped_column(Text, default="")
    resolved_by: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
