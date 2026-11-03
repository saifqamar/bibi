import uuid
from datetime import datetime
from enum import StrEnum
from typing import Any

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.db import Base, TimestampMixin, UUIDPrimaryKey


def _enum(enum_cls: type[StrEnum], name: str) -> Enum:
    return Enum(
        enum_cls,
        name=name,
        native_enum=False,
        create_constraint=True,
        length=20,
        values_callable=lambda e: [m.value for m in e],
    )


def _series_fk() -> Mapped[uuid.UUID]:
    return mapped_column(ForeignKey("series.id", ondelete="CASCADE"), index=True)


class Character(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "characters"

    series_id: Mapped[uuid.UUID] = _series_fk()
    name: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(Text, default="")
    traits: Mapped[list[str]] = mapped_column(ARRAY(String(80)), default=list)
    voice_notes: Mapped[str] = mapped_column(Text, default="")
    is_narrator: Mapped[bool] = mapped_column(Boolean, default=False)


class Relationship(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "relationships"
    __table_args__ = (CheckConstraint("character_a_id <> character_b_id", name="distinct_people"),)

    series_id: Mapped[uuid.UUID] = _series_fk()
    character_a_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("characters.id", ondelete="CASCADE")
    )
    character_b_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("characters.id", ondelete="CASCADE")
    )
    description: Mapped[str] = mapped_column(Text, default="")
    from_episode: Mapped[int | None] = mapped_column(Integer, nullable=True)


class Location(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "locations"

    series_id: Mapped[uuid.UUID] = _series_fk()
    name: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(Text, default="")


class WorldRule(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "world_rules"

    series_id: Mapped[uuid.UUID] = _series_fk()
    rule_text: Mapped[str] = mapped_column(Text)


class TimelineEvent(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "timeline_events"

    series_id: Mapped[uuid.UUID] = _series_fk()
    description: Mapped[str] = mapped_column(Text)
    episode_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    story_time: Mapped[str] = mapped_column(String(120), default="")
    position: Mapped[int] = mapped_column(Integer, default=0)


class PlotThreadStatus(StrEnum):
    OPEN = "open"
    RESOLVED = "resolved"


class PlotThread(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "plot_threads"

    series_id: Mapped[uuid.UUID] = _series_fk()
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[PlotThreadStatus] = mapped_column(
        _enum(PlotThreadStatus, "plot_thread_status"), default=PlotThreadStatus.OPEN
    )
    opened_in_episode: Mapped[int | None] = mapped_column(Integer, nullable=True)
    resolved_in_episode: Mapped[int | None] = mapped_column(Integer, nullable=True)


class ProposalOp(StrEnum):
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"


class ProposalStatus(StrEnum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


class CanonProposal(UUIDPrimaryKey, TimestampMixin, Base):
    """A change to the story bible suggested by the AI. Only accepting it changes canon."""

    __tablename__ = "canon_proposals"
    __table_args__ = (Index("ix_canon_proposals_series_status", "series_id", "status"),)

    series_id: Mapped[uuid.UUID] = _series_fk()
    episode_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("episodes.id", ondelete="SET NULL"), nullable=True
    )
    entity_type: Mapped[str] = mapped_column(String(40))
    op: Mapped[ProposalOp] = mapped_column(_enum(ProposalOp, "proposal_op"))
    entity_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)
    payload: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
    reason: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[ProposalStatus] = mapped_column(
        _enum(ProposalStatus, "proposal_status"), default=ProposalStatus.PENDING
    )
    decided_by: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    decided_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class EpisodeStatus(StrEnum):
    PLANNED = "planned"
    DRAFTING = "drafting"
    READY_FOR_AUDIO = "ready_for_audio"
    AUDIO_READY = "audio_ready"
    IN_REVIEW = "in_review"
    CHANGES_REQUESTED = "changes_requested"
    APPROVED = "approved"
    PUBLISHED = "published"


class DraftSource(StrEnum):
    AI = "ai"
    HUMAN = "human"


class Episode(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "episodes"
    __table_args__ = (UniqueConstraint("series_id", "number", name="uq_episodes_series_number"),)

    series_id: Mapped[uuid.UUID] = _series_fk()
    number: Mapped[int] = mapped_column(Integer)
    title: Mapped[str] = mapped_column(String(200), default="")
    status: Mapped[EpisodeStatus] = mapped_column(
        _enum(EpisodeStatus, "episode_status"), default=EpisodeStatus.PLANNED
    )
    current_draft_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("episode_drafts.id", ondelete="SET NULL", use_alter=True), nullable=True
    )
    # Audio assets arrive in plan 07; the FK is added there.
    current_audio_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)
    # None = follow the series' free episode count; True/False = admin override (plan 09).
    is_free: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class EpisodePlan(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "episode_plans"

    episode_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("episodes.id", ondelete="CASCADE"), unique=True
    )
    beats: Mapped[list[dict[str, Any]]] = mapped_column(JSONB, default=list)
    notes: Mapped[str] = mapped_column(Text, default="")


class EpisodeDraft(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "episode_drafts"
    __table_args__ = (UniqueConstraint("episode_id", "version", name="uq_episode_drafts_version"),)

    episode_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("episodes.id", ondelete="CASCADE"), index=True
    )
    version: Mapped[int] = mapped_column(Integer)
    text: Mapped[str] = mapped_column(Text)
    source: Mapped[DraftSource] = mapped_column(_enum(DraftSource, "draft_source"))
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    note: Mapped[str] = mapped_column(String(500), default="")
