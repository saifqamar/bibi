import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any, Literal

from pydantic import BaseModel, Field

EventType = Literal[
    "play_started",
    "play_paused",
    "play_resumed",
    "play_completed",
    "drop_off",
    "next_episode_started",
    "download_started",
    "download_completed",
]

MAX_BATCH = 200


class EventIn(BaseModel):
    client_event_id: str = Field(min_length=8, max_length=64)
    type: str = Field(max_length=30)  # validated per item so one bad event does not drop the batch
    episode_id: uuid.UUID
    position_seconds: Decimal = Field(default=Decimal(0), ge=0, le=86_400)
    to_episode_id: uuid.UUID | None = None
    session_id: str = Field(default="", max_length=64)
    client_ts: datetime
    device: dict[str, Any] = Field(default_factory=dict)


class EventBatchIn(BaseModel):
    events: list[EventIn] = Field(min_length=1, max_length=MAX_BATCH)


class RejectedEvent(BaseModel):
    index: int
    code: str


class EventBatchOut(BaseModel):
    accepted: int
    duplicates: int
    rejected: list[RejectedEvent]


class ProgressIn(BaseModel):
    position_seconds: Decimal = Field(ge=0, le=86_400)
    client_ts: datetime
    completed: bool = False


class ProgressOut(BaseModel):
    episode_id: uuid.UUID
    series_id: uuid.UUID
    series_title: str
    episode_number: int
    episode_title: str
    position_seconds: Decimal
    duration_seconds: Decimal | None
    completed: bool
    updated_at: datetime


class DownloadIn(BaseModel):
    episode_id: uuid.UUID


class DownloadOut(BaseModel):
    episode_id: uuid.UUID
    downloaded_at: datetime
    available: bool  # false when the episode was unpublished: the app deletes its copy
