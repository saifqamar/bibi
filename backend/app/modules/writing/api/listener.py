"""Listener-facing episode endpoints: only published episodes of visible series."""

import uuid
from datetime import datetime
from decimal import Decimal

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.modules.catalog import CatalogService, SeriesStatus
from app.modules.identity import CurrentUser, require_listener
from app.modules.writing.episodes import EpisodeService
from app.modules.writing.models import Episode
from app.shared.db import get_db
from app.shared.errors import NotFound

router = APIRouter(tags=["catalog"])

VISIBLE = (SeriesStatus.PUBLISHED, SeriesStatus.ARCHIVED)


class ListenerEpisodeOut(BaseModel):
    id: uuid.UUID
    series_id: uuid.UUID
    number: int
    title: str
    duration_seconds: Decimal | None
    is_free: bool
    published_at: datetime | None


def is_free(episode: Episode, free_episode_count: int) -> bool:
    return episode.is_free if episode.is_free is not None else episode.number <= free_episode_count


def listener_episode(episode: Episode, free_episode_count: int) -> ListenerEpisodeOut:
    return ListenerEpisodeOut(
        id=episode.id,
        series_id=episode.series_id,
        number=episode.number,
        title=episode.title,
        duration_seconds=episode.published_duration_seconds,
        is_free=is_free(episode, free_episode_count),
        published_at=episode.published_at,
    )


@router.get("/series/{series_id}/episodes", response_model=list[ListenerEpisodeOut])
def list_series_episodes(
    series_id: uuid.UUID,
    request: Request,
    _: CurrentUser = Depends(require_listener),
    db: Session = Depends(get_db),
) -> list[ListenerEpisodeOut]:
    container = request.app.state.container
    series = CatalogService(db, container).get_series(series_id)
    if series.status not in VISIBLE:
        raise NotFound("Series not found")
    return [
        listener_episode(e, series.free_episode_count)
        for e in EpisodeService(db, container).live_episodes(series_id)
    ]


@router.get("/episodes/{episode_id}", response_model=ListenerEpisodeOut)
def get_episode(
    episode_id: uuid.UUID,
    request: Request,
    _: CurrentUser = Depends(require_listener),
    db: Session = Depends(get_db),
) -> ListenerEpisodeOut:
    container = request.app.state.container
    try:
        episode = EpisodeService(db, container).get(episode_id)
    except NotFound:
        raise NotFound("Episode not found") from None
    series = CatalogService(db, container).get_series(episode.series_id)
    if episode.published_audio_id is None or series.status not in VISIBLE:
        raise NotFound("Episode not found")
    return listener_episode(episode, series.free_episode_count)
