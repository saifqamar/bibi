import uuid

from fastapi import APIRouter, Depends, Query, Request, Response, status
from sqlalchemy.orm import Session

from app.modules.identity import CurrentUser, require_listener
from app.modules.listening.schemas import (
    DownloadIn,
    DownloadOut,
    EventBatchIn,
    EventBatchOut,
    ProgressIn,
    ProgressOut,
)
from app.modules.listening.service import ListeningService
from app.shared.db import get_db
from app.shared.ratelimit import rate_limit

router = APIRouter(tags=["listening"])


def get_listening_service(request: Request, db: Session = Depends(get_db)) -> ListeningService:
    return ListeningService(db, request.app.state.container)


@router.post(
    "/events",
    response_model=EventBatchOut,
    # The 256 KB body limit is enforced by BodySizeLimitMiddleware, before parsing.
    dependencies=[Depends(rate_limit("events", limit=120, window_seconds=60))],
)
def post_events(
    body: EventBatchIn,
    user: CurrentUser = Depends(require_listener),
    service: ListeningService = Depends(get_listening_service),
) -> EventBatchOut:
    return service.ingest(user, body.events)


@router.get("/me/progress", response_model=list[ProgressOut])
def get_progress(
    limit: int = Query(50, ge=1, le=200),
    user: CurrentUser = Depends(require_listener),
    service: ListeningService = Depends(get_listening_service),
) -> list[ProgressOut]:
    return service.progress(user, limit)


@router.put("/me/progress/{episode_id}", response_model=ProgressOut)
def put_progress(
    episode_id: uuid.UUID,
    body: ProgressIn,
    user: CurrentUser = Depends(require_listener),
    service: ListeningService = Depends(get_listening_service),
) -> ProgressOut:
    return service.put_progress(user, episode_id, body)


@router.get("/me/downloads", response_model=list[DownloadOut])
def get_downloads(
    user: CurrentUser = Depends(require_listener),
    service: ListeningService = Depends(get_listening_service),
) -> list[DownloadOut]:
    return service.downloads(user)


@router.post("/me/downloads", response_model=DownloadOut, status_code=201)
def add_download(
    body: DownloadIn,
    user: CurrentUser = Depends(require_listener),
    service: ListeningService = Depends(get_listening_service),
) -> DownloadOut:
    return service.add_download(user, body.episode_id)


@router.delete("/me/downloads/{episode_id}", status_code=204)
def remove_download(
    episode_id: uuid.UUID,
    user: CurrentUser = Depends(require_listener),
    service: ListeningService = Depends(get_listening_service),
) -> Response:
    service.remove_download(user, episode_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


routers = [router]
