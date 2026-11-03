import uuid
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.modules.writing.models import PlotThreadStatus, ProposalOp, ProposalStatus

Name = Field(min_length=1, max_length=120)
LongText = Field(default="", max_length=10_000)
EpisodeNumber = Field(default=None, ge=1, le=10_000)


class _In(BaseModel):
    model_config = ConfigDict(extra="forbid")


class _Out(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    series_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


# Characters -------------------------------------------------------------------------------


class CharacterCreate(_In):
    name: str = Name
    description: str = LongText
    traits: list[str] = Field(default_factory=list, max_length=30)
    voice_notes: str = Field(default="", max_length=2000)
    is_narrator: bool = False


class CharacterUpdate(_In):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=10_000)
    traits: list[str] | None = Field(default=None, max_length=30)
    voice_notes: str | None = Field(default=None, max_length=2000)
    is_narrator: bool | None = None


class CharacterOut(_Out):
    name: str
    description: str
    traits: list[str]
    voice_notes: str
    is_narrator: bool


# Relationships -----------------------------------------------------------------------------


class RelationshipCreate(_In):
    character_a_id: uuid.UUID
    character_b_id: uuid.UUID
    description: str = LongText
    from_episode: int | None = EpisodeNumber

    @model_validator(mode="after")
    def _distinct(self) -> "RelationshipCreate":
        if self.character_a_id == self.character_b_id:
            raise ValueError("A relationship needs two different characters")
        return self


class RelationshipUpdate(_In):
    character_a_id: uuid.UUID | None = None
    character_b_id: uuid.UUID | None = None
    description: str | None = Field(default=None, max_length=10_000)
    from_episode: int | None = EpisodeNumber


class RelationshipOut(_Out):
    character_a_id: uuid.UUID
    character_b_id: uuid.UUID
    description: str
    from_episode: int | None


# Locations ---------------------------------------------------------------------------------


class LocationCreate(_In):
    name: str = Name
    description: str = LongText


class LocationUpdate(_In):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=10_000)


class LocationOut(_Out):
    name: str
    description: str


# World rules -------------------------------------------------------------------------------


class WorldRuleCreate(_In):
    rule_text: str = Field(min_length=1, max_length=2000)


class WorldRuleUpdate(_In):
    rule_text: str | None = Field(default=None, min_length=1, max_length=2000)


class WorldRuleOut(_Out):
    rule_text: str


# Timeline ----------------------------------------------------------------------------------


class TimelineEventCreate(_In):
    description: str = Field(min_length=1, max_length=2000)
    episode_number: int | None = EpisodeNumber
    story_time: str = Field(default="", max_length=120)
    position: int | None = Field(default=None, ge=0)


class TimelineEventUpdate(_In):
    description: str | None = Field(default=None, min_length=1, max_length=2000)
    episode_number: int | None = EpisodeNumber
    story_time: str | None = Field(default=None, max_length=120)
    position: int | None = Field(default=None, ge=0)


class TimelineEventOut(_Out):
    description: str
    episode_number: int | None
    story_time: str
    position: int


# Plot threads ------------------------------------------------------------------------------


class PlotThreadCreate(_In):
    title: str = Field(min_length=1, max_length=200)
    description: str = LongText
    status: PlotThreadStatus = PlotThreadStatus.OPEN
    opened_in_episode: int | None = EpisodeNumber
    resolved_in_episode: int | None = EpisodeNumber


class PlotThreadUpdate(_In):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=10_000)
    status: PlotThreadStatus | None = None
    opened_in_episode: int | None = EpisodeNumber
    resolved_in_episode: int | None = EpisodeNumber


class PlotThreadOut(_Out):
    title: str
    description: str
    status: PlotThreadStatus
    opened_in_episode: int | None
    resolved_in_episode: int | None


# Whole bible -------------------------------------------------------------------------------


class BibleOut(BaseModel):
    characters: list[CharacterOut]
    relationships: list[RelationshipOut]
    locations: list[LocationOut]
    world_rules: list[WorldRuleOut]
    timeline: list[TimelineEventOut]
    plot_threads: list[PlotThreadOut]


EntityType = Literal[
    "characters", "relationships", "locations", "world-rules", "timeline", "plot-threads"
]


class ProposalIn(BaseModel):
    """What the AI module submits. Validated against the entity's schemas when accepted."""

    entity_type: EntityType
    op: ProposalOp
    entity_id: uuid.UUID | None = None
    payload: dict[str, Any] = Field(default_factory=dict)
    reason: str = Field(default="", max_length=2000)
    episode_id: uuid.UUID | None = None


class ProposalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    series_id: uuid.UUID
    episode_id: uuid.UUID | None
    entity_type: str
    op: ProposalOp
    entity_id: uuid.UUID | None
    payload: dict[str, Any]
    current: dict[str, Any] | None = None  # the entity as it is now (for update/delete diffs)
    reason: str
    status: ProposalStatus
    decided_by: uuid.UUID | None
    decided_at: datetime | None
    created_at: datetime


class ProposalAcceptIn(BaseModel):
    """Optionally accept with edits: the writer can adjust the payload first."""

    payload: dict[str, Any] | None = None


class InUseOut(BaseModel):
    references: list[str]
