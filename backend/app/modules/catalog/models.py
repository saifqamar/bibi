import uuid
from datetime import datetime
from enum import StrEnum

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.db import Base, TimestampMixin, UUIDPrimaryKey


class SeriesStatus(StrEnum):
    DRAFT = "draft"
    IN_REVIEW = "in_review"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class ShelfKind(StrEnum):
    MOOD = "mood"
    THEME = "theme"
    GENRE = "genre"


def _enum(enum_cls: type[StrEnum], name: str) -> Enum:
    return Enum(
        enum_cls,
        name=name,
        native_enum=False,
        create_constraint=True,
        length=20,
        values_callable=lambda e: [m.value for m in e],
    )


class Series(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "series"
    __table_args__ = (
        CheckConstraint("is_ai_assisted", name="always_ai_assisted"),
        CheckConstraint("free_episode_count >= 0", name="free_episode_count_non_negative"),
        Index("ix_series_status_title", "status", "title"),
    )

    owner_writer_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True
    )
    title: Mapped[str] = mapped_column(String(200))
    premise: Mapped[str] = mapped_column(Text, default="")
    language: Mapped[str] = mapped_column(String(20), default="en")
    tone: Mapped[str] = mapped_column(String(200), default="")
    themes: Mapped[list[str]] = mapped_column(ARRAY(String(60)), default=list)
    target_episode_minutes: Mapped[int] = mapped_column(Integer, default=18)
    status: Mapped[SeriesStatus] = mapped_column(
        _enum(SeriesStatus, "series_status"), default=SeriesStatus.DRAFT
    )
    # Every story is labelled AI-assisted; the check constraint makes this impossible to turn off.
    is_ai_assisted: Mapped[bool] = mapped_column(Boolean, default=True)
    free_episode_count: Mapped[int] = mapped_column(Integer, default=1)
    play_count: Mapped[int] = mapped_column(BigInteger, default=0)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Shelf(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "shelves"

    title: Mapped[str] = mapped_column(String(120))
    kind: Mapped[ShelfKind] = mapped_column(_enum(ShelfKind, "shelf_kind"), default=ShelfKind.MOOD)
    position: Mapped[int] = mapped_column(Integer, default=0)


class ShelfItem(TimestampMixin, Base):
    __tablename__ = "shelf_items"

    shelf_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("shelves.id", ondelete="CASCADE"), primary_key=True
    )
    series_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("series.id", ondelete="CASCADE"), primary_key=True
    )
    position: Mapped[int] = mapped_column(Integer, default=0)


class CoverAsset(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "cover_assets"

    series_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("series.id", ondelete="CASCADE"), index=True
    )
    storage_key: Mapped[str] = mapped_column(String(512))
    content_type: Mapped[str] = mapped_column(String(50))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
