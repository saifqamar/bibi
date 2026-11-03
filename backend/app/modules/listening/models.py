import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    ForeignKey,
    Identity,
    Index,
    Numeric,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.db import Base, TimestampMixin, UUIDPrimaryKey

EVENT_TYPES = (
    "play_started",
    "play_paused",
    "play_resumed",
    "play_completed",
    "drop_off",
    "next_episode_started",
    "download_started",
    "download_completed",
)


class ListeningEvent(UUIDPrimaryKey, Base):
    __tablename__ = "listening_events"
    __table_args__ = (
        # Sending the same batch twice is harmless: (user, client event id) is unique.
        UniqueConstraint("user_id", "client_event_id", name="uq_listening_events_client_id"),
        Index("ix_listening_events_episode_type", "episode_id", "event_type"),
    )

    # Increasing cursor for the aggregation job.
    seq: Mapped[int] = mapped_column(BigInteger, Identity(), unique=True)
    client_event_id: Mapped[str] = mapped_column(String(64))
    # Null after the listener deletes their account (events are kept anonymised).
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    episode_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("episodes.id", ondelete="CASCADE"))
    series_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("series.id", ondelete="CASCADE"))
    event_type: Mapped[str] = mapped_column(String(30))
    position_seconds: Mapped[Decimal] = mapped_column(Numeric(10, 3), default=Decimal(0))
    to_episode_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)
    session_id: Mapped[str] = mapped_column(String(64), default="")
    device: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
    client_ts: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    received_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )


class PlaybackProgress(Base):
    __tablename__ = "playback_progress"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    episode_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("episodes.id", ondelete="CASCADE"), primary_key=True
    )
    series_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("series.id", ondelete="CASCADE"))
    position_seconds: Mapped[Decimal] = mapped_column(Numeric(10, 3))
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    client_ts: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class Download(TimestampMixin, Base):
    __tablename__ = "downloads"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    episode_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("episodes.id", ondelete="CASCADE"), primary_key=True
    )
    downloaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    removed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
