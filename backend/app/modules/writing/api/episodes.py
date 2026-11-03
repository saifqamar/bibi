import uuid

from fastapi import APIRouter, Depends, Query, Request, Response, status
from sqlalchemy.orm import Session

from app.modules.identity import CurrentUser, require_studio
from app.modules.writing.episodes import EpisodeService, draft_out
from app.modules.writing.schemas import (
    CompareOut,
    DraftIn,
    DraftOut,
    DraftSummary,
    EpisodeCreate,
    EpisodeOrderIn,
    EpisodeOut,
    EpisodeUpdate,
    PlanIn,
    ScriptLineOut,
    StatusIn,
)
from app.shared.db import get_db

router = APIRouter(prefix="/studio", tags=["studio: episodes"])


def get_episode_service(request: Request, db: Session = Depends(get_db)) -> EpisodeService:
    return EpisodeService(db, request.app.state.container)


@router.get("/series/{series_id}/episodes", response_model=list[EpisodeOut])
def list_episodes(
    series_id: uuid.UUID,
    user: CurrentUser = Depends(require_studio),
    service: EpisodeService = Depends(get_episode_service),
) -> list[EpisodeOut]:
    return service.list_for_series(user, series_id)


@router.post(
    "/series/{series_id}/episodes", response_model=EpisodeOut, status_code=status.HTTP_201_CREATED
)
def create_episode(
    series_id: uuid.UUID,
    body: EpisodeCreate,
    user: CurrentUser = Depends(require_studio),
    service: EpisodeService = Depends(get_episode_service),
) -> EpisodeOut:
    return service.to_out(service.create(user, series_id, body.title))


@router.put("/series/{series_id}/episodes/order", status_code=status.HTTP_204_NO_CONTENT)
def reorder_episodes(
    series_id: uuid.UUID,
    body: EpisodeOrderIn,
    user: CurrentUser = Depends(require_studio),
    service: EpisodeService = Depends(get_episode_service),
) -> Response:
    service.reorder(user, series_id, body.episode_ids)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/episodes/{episode_id}", response_model=EpisodeOut)
def get_episode(
    episode_id: uuid.UUID,
    user: CurrentUser = Depends(require_studio),
    service: EpisodeService = Depends(get_episode_service),
) -> EpisodeOut:
    return service.to_out(service.get_for_user(user, episode_id))


@router.put("/episodes/{episode_id}", response_model=EpisodeOut)
def update_episode(
    episode_id: uuid.UUID,
    body: EpisodeUpdate,
    user: CurrentUser = Depends(require_studio),
    service: EpisodeService = Depends(get_episode_service),
) -> EpisodeOut:
    episode = service.get_for_user(user, episode_id)
    if body.title is not None:
        episode = service.update_title(user, episode_id, body.title)
    return service.to_out(episode)


@router.delete("/episodes/{episode_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_episode(
    episode_id: uuid.UUID,
    user: CurrentUser = Depends(require_studio),
    service: EpisodeService = Depends(get_episode_service),
) -> Response:
    service.delete(user, episode_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.put("/episodes/{episode_id}/plan", response_model=EpisodeOut)
def set_plan(
    episode_id: uuid.UUID,
    body: PlanIn,
    user: CurrentUser = Depends(require_studio),
    service: EpisodeService = Depends(get_episode_service),
) -> EpisodeOut:
    return service.to_out(service.set_plan(user, episode_id, body))


@router.get("/episodes/{episode_id}/drafts", response_model=list[DraftSummary])
def list_drafts(
    episode_id: uuid.UUID,
    user: CurrentUser = Depends(require_studio),
    service: EpisodeService = Depends(get_episode_service),
) -> list[DraftSummary]:
    return service.list_drafts(user, episode_id)


@router.post("/episodes/{episode_id}/drafts", response_model=DraftOut)
def save_draft(
    episode_id: uuid.UUID,
    body: DraftIn,
    response: Response,
    user: CurrentUser = Depends(require_studio),
    service: EpisodeService = Depends(get_episode_service),
) -> DraftOut:
    draft, created = service.save_draft(user, episode_id, body.text, body.base_version, body.note)
    response.status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
    return draft_out(draft)


@router.get("/episodes/{episode_id}/drafts/compare", response_model=CompareOut)
def compare_drafts(
    episode_id: uuid.UUID,
    a: int = Query(ge=1),
    b: int = Query(ge=1),
    user: CurrentUser = Depends(require_studio),
    service: EpisodeService = Depends(get_episode_service),
) -> CompareOut:
    return service.compare(user, episode_id, a, b)


@router.get("/episodes/{episode_id}/drafts/{version}", response_model=DraftOut)
def get_draft(
    episode_id: uuid.UUID,
    version: int,
    user: CurrentUser = Depends(require_studio),
    service: EpisodeService = Depends(get_episode_service),
) -> DraftOut:
    return service.get_draft(user, episode_id, version)


@router.post("/episodes/{episode_id}/drafts/{version}/restore", response_model=DraftOut)
def restore_draft(
    episode_id: uuid.UUID,
    version: int,
    user: CurrentUser = Depends(require_studio),
    service: EpisodeService = Depends(get_episode_service),
) -> DraftOut:
    return draft_out(service.restore(user, episode_id, version))


@router.get("/episodes/{episode_id}/script", response_model=list[ScriptLineOut])
def get_script(
    episode_id: uuid.UUID,
    user: CurrentUser = Depends(require_studio),
    service: EpisodeService = Depends(get_episode_service),
) -> list[ScriptLineOut]:
    return service.script(user, episode_id)


@router.post("/episodes/{episode_id}/status", response_model=EpisodeOut)
def set_status(
    episode_id: uuid.UUID,
    body: StatusIn,
    user: CurrentUser = Depends(require_studio),
    service: EpisodeService = Depends(get_episode_service),
) -> EpisodeOut:
    return service.to_out(service.writer_set_status(user, episode_id, body.status))
