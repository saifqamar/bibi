import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class VoiceIn(BaseModel):
    provider: str = Field(min_length=1, max_length=40)
    provider_voice_id: str = Field(min_length=1, max_length=120)
    name: str = Field(min_length=1, max_length=120)
    language: str = Field(default="en", min_length=2, max_length=20)
    description: str = Field(default="", max_length=2000)
    sample_text: str | None = Field(default=None, min_length=1, max_length=500)


class VoiceUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    language: str | None = Field(default=None, min_length=2, max_length=20)
    description: str | None = Field(default=None, max_length=2000)
    sample_text: str | None = Field(default=None, min_length=1, max_length=500)
    is_active: bool | None = None


class VoiceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    provider: str
    provider_voice_id: str
    name: str
    language: str
    description: str
    sample_text: str
    is_active: bool


class VoicePreviewOut(BaseModel):
    url: str | None = Field(description="null while the preview is being generated")


class AssignmentIn(BaseModel):
    character_id: uuid.UUID | None = Field(description="null assigns the narrator voice")
    voice_id: uuid.UUID


class AssignmentsIn(BaseModel):
    assignments: list[AssignmentIn] = Field(max_length=500)


class CastMember(BaseModel):
    character_id: uuid.UUID | None
    name: str
    voice_notes: str
    voice_id: uuid.UUID | None


class AssignmentsOut(BaseModel):
    cast: list[CastMember]


class AudioLineOut(BaseModel):
    id: uuid.UUID
    position: int
    kind: str
    source_line: int
    speaker: str | None
    voice_id: uuid.UUID | None
    text: str
    status: str
    duration_ms: int
    flag: str | None
    error: str | None
    url: str | None


class AudioAssetOut(BaseModel):
    id: uuid.UUID
    url: str
    format: str
    duration_seconds: Decimal
    loudness_lufs: Decimal | None
    peak_dbfs: Decimal | None
    created_at: datetime


class RenderOut(BaseModel):
    id: uuid.UUID
    draft_version: int
    status: str
    workflow_run_id: uuid.UUID | None
    lines_total: int
    lines_done: int
    error: str | None
    created_at: datetime


class EpisodeAudioOut(BaseModel):
    render: RenderOut | None
    asset: AudioAssetOut | None
    lines: list[AudioLineOut]
    is_current: bool  # the latest asset matches the current draft version


class StartRenderOut(BaseModel):
    render_id: uuid.UUID
    workflow_run_id: uuid.UUID


class LineTextIn(BaseModel):
    text: str = Field(min_length=1, max_length=4000)
