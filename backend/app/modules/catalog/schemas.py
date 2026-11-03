import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.modules.catalog.models import SeriesStatus, ShelfKind

Title = Field(min_length=1, max_length=200)
Language = Field(min_length=2, max_length=20, pattern=r"^[a-z]{2,3}(-[A-Za-z0-9]{2,8})?$")
Themes = Field(max_length=12)


class SeriesCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Title
    premise: str = Field(default="", max_length=5000)
    language: str = Language
    tone: str = Field(default="", max_length=200)
    themes: list[str] = Themes
    target_episode_minutes: int = Field(default=18, ge=5, le=60)


class SeriesUpdate(BaseModel):
    """Fields a writer can change on their own series."""

    model_config = ConfigDict(extra="forbid")

    title: str | None = Field(default=None, min_length=1, max_length=200)
    premise: str | None = Field(default=None, max_length=5000)
    language: str | None = Field(
        default=None, min_length=2, max_length=20, pattern=r"^[a-z]{2,3}(-[A-Za-z0-9]{2,8})?$"
    )
    tone: str | None = Field(default=None, max_length=200)
    themes: list[str] | None = Field(default=None, max_length=12)
    target_episode_minutes: int | None = Field(default=None, ge=5, le=60)


class AdminSeriesUpdate(SeriesUpdate):
    """Admins can also change catalog settings. ``is_ai_assisted`` can only ever be true."""

    free_episode_count: int | None = Field(default=None, ge=0, le=1000)
    owner_writer_id: uuid.UUID | None = None
    archived: bool | None = None
    is_ai_assisted: Literal[True] | None = None


class SeriesOut(BaseModel):
    """Studio view of a series (writers and admins)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    owner_writer_id: uuid.UUID | None
    title: str
    premise: str
    language: str
    tone: str
    themes: list[str]
    target_episode_minutes: int
    status: SeriesStatus
    is_ai_assisted: bool
    free_episode_count: int
    play_count: int
    published_at: datetime | None
    cover_url: str | None = None
    created_at: datetime
    updated_at: datetime


class ListenerSeriesOut(BaseModel):
    """Listener view of a published series. Always carries the AI-assisted label."""

    id: uuid.UUID
    title: str
    premise: str
    language: str
    tone: str
    themes: list[str]
    is_ai_assisted: Literal[True] = True
    free_episode_count: int
    play_count: int
    cover_url: str | None
    published_at: datetime | None


class ShelfCreate(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    kind: ShelfKind = ShelfKind.MOOD


class ShelfUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=120)
    kind: ShelfKind | None = None


class ShelfOrderIn(BaseModel):
    shelf_ids: list[uuid.UUID] = Field(max_length=200)


class ShelfItemsIn(BaseModel):
    series_ids: list[uuid.UUID] = Field(max_length=200)


class AdminShelfOut(BaseModel):
    id: uuid.UUID
    title: str
    kind: ShelfKind
    position: int
    series_ids: list[uuid.UUID]


class ListenerShelfOut(BaseModel):
    id: uuid.UUID
    title: str
    kind: ShelfKind
    series: list[ListenerSeriesOut]
