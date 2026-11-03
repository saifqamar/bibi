import uuid
from decimal import Decimal
from enum import StrEnum

from sqlalchemy import (
    Boolean,
    Enum,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
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


class Voice(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "voices"
    __table_args__ = (UniqueConstraint("provider", "provider_voice_id", name="uq_voices_provider"),)

    provider: Mapped[str] = mapped_column(String(40))
    provider_voice_id: Mapped[str] = mapped_column(String(120))
    name: Mapped[str] = mapped_column(String(120))
    language: Mapped[str] = mapped_column(String(20), default="en")
    description: Mapped[str] = mapped_column(Text, default="")
    sample_text: Mapped[str] = mapped_column(
        Text, default="The fog came in at dusk, and with it, the sound of a bell."
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class VoiceAssignment(UUIDPrimaryKey, TimestampMixin, Base):
    """Voice per character in a series. ``character_id`` null is the narrator."""

    __tablename__ = "voice_assignments"
    __table_args__ = (
        UniqueConstraint("series_id", "character_id", name="uq_voice_assignments_character"),
        # Only one narrator row per series (NULLs are distinct in a plain unique constraint).
        Index(
            "uq_voice_assignments_narrator",
            "series_id",
            unique=True,
            postgresql_where="character_id IS NULL",
        ),
    )

    series_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("series.id", ondelete="CASCADE"), index=True
    )
    character_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("characters.id", ondelete="CASCADE"), nullable=True
    )
    voice_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("voices.id", ondelete="RESTRICT"))


class RenderStatus(StrEnum):
    QUEUED = "queued"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"


class AudioRender(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "audio_renders"

    episode_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("episodes.id", ondelete="CASCADE"), index=True
    )
    draft_version: Mapped[int] = mapped_column(Integer)
    status: Mapped[RenderStatus] = mapped_column(
        _enum(RenderStatus, "render_status"), default=RenderStatus.QUEUED
    )
    workflow_run_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("workflow_runs.id", ondelete="SET NULL"), nullable=True
    )
    lines_total: Mapped[int] = mapped_column(Integer, default=0)
    lines_done: Mapped[int] = mapped_column(Integer, default=0)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)


class LineStatus(StrEnum):
    PENDING = "pending"
    DONE = "done"
    FAILED = "failed"


class AudioLine(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "audio_lines"
    __table_args__ = (
        UniqueConstraint("render_id", "position", name="uq_audio_lines_position"),
        Index("ix_audio_lines_text_hash", "text_hash"),
    )

    render_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("audio_renders.id", ondelete="CASCADE")
    )
    position: Mapped[int] = mapped_column(Integer)
    kind: Mapped[str] = mapped_column(String(20))  # dialogue | narration | scene_break
    source_line: Mapped[int] = mapped_column(Integer)
    paragraph: Mapped[int] = mapped_column(Integer)
    speaker: Mapped[str | None] = mapped_column(String(120), nullable=True)
    character_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("characters.id", ondelete="SET NULL"), nullable=True
    )
    voice_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("voices.id", ondelete="SET NULL"), nullable=True
    )
    text: Mapped[str] = mapped_column(Text)
    text_hash: Mapped[str] = mapped_column(String(64))  # voice + text: same hash, same audio
    storage_key: Mapped[str | None] = mapped_column(String(512), nullable=True)
    duration_ms: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[LineStatus] = mapped_column(
        _enum(LineStatus, "line_status"), default=LineStatus.PENDING
    )
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    flag: Mapped[str | None] = mapped_column(String(40), nullable=True)


class AudioAsset(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "audio_assets"

    episode_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("episodes.id", ondelete="CASCADE"), index=True
    )
    render_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("audio_renders.id", ondelete="SET NULL"), nullable=True
    )
    kind: Mapped[str] = mapped_column(String(20), default="episode")  # episode | sample
    storage_key: Mapped[str] = mapped_column(String(512))
    format: Mapped[str] = mapped_column(String(10))
    duration_seconds: Mapped[Decimal] = mapped_column(Numeric(10, 3))
    loudness_lufs: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), nullable=True)
    peak_dbfs: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), nullable=True)
