import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.modules.ai import CostSummary
from app.modules.audio import AudioAssetOut
from app.modules.writing import DraftSummary


class ReviewItemOut(BaseModel):
    id: uuid.UUID
    episode_id: uuid.UUID
    episode_number: int
    episode_title: str
    series_id: uuid.UUID
    series_title: str
    writer_id: uuid.UUID | None
    draft_version: int
    status: str
    comments: str
    submitted_at: datetime
    decided_at: datetime | None


class ReviewDetailOut(BaseModel):
    item: ReviewItemOut
    episode_status: str
    is_live: bool
    text: str
    audio: AudioAssetOut | None
    continuity: list[dict[str, Any]]
    cost: CostSummary
    versions: list[DraftSummary]


class ApproveIn(BaseModel):
    publish_now: bool = False
    comments: str = Field(default="", max_length=5000)


class CommentsIn(BaseModel):
    comments: str = Field(max_length=5000)


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    kind: str
    episode_id: uuid.UUID | None
    review_item_id: uuid.UUID | None
    message: str
    read_at: datetime | None
    created_at: datetime


class NotificationsOut(BaseModel):
    items: list[NotificationOut]
    unread: int


class AuditEntryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    actor_id: uuid.UUID | None
    action: str
    entity_type: str
    entity_id: str | None
    meta: dict[str, Any] = Field(serialization_alias="metadata")
    created_at: datetime


class EpisodeAccessIn(BaseModel):
    is_free: bool | None = Field(description="null follows the series' free episode count")


class EpisodeAccessOut(BaseModel):
    episode_id: uuid.UUID
    is_free: bool | None
