import uuid

from fastapi import APIRouter, Depends, Query, Request, Response, status
from sqlalchemy.orm import Session

from app.modules.admin.schemas import (
    ApproveIn,
    CommentsIn,
    NotificationsOut,
    ReviewDetailOut,
    ReviewItemOut,
)
from app.modules.admin.service import ReviewService
from app.modules.identity import CurrentUser, require_admin, require_studio
from app.shared.db import get_db
from app.shared.pagination import Page, PageParams, make_page, page_params, paginate

studio_router = APIRouter(prefix="/studio", tags=["studio: review"])
admin_router = APIRouter(prefix="/admin", tags=["admin: review"])


def get_review_service(request: Request, db: Session = Depends(get_db)) -> ReviewService:
    return ReviewService(db, request.app.state.container)


@studio_router.post("/episodes/{episode_id}/submit", response_model=ReviewItemOut, status_code=201)
def submit(
    episode_id: uuid.UUID,
    user: CurrentUser = Depends(require_studio),
    service: ReviewService = Depends(get_review_service),
) -> ReviewItemOut:
    return service.item_out(service.submit(user, episode_id))


@studio_router.get("/episodes/{episode_id}/reviews", response_model=list[ReviewItemOut])
def episode_reviews(
    episode_id: uuid.UUID,
    user: CurrentUser = Depends(require_studio),
    service: ReviewService = Depends(get_review_service),
) -> list[ReviewItemOut]:
    return service.reviews_for_episode(user, episode_id)


@studio_router.get("/notifications", response_model=NotificationsOut)
def notifications(
    limit: int = Query(30, ge=1, le=100),
    user: CurrentUser = Depends(require_studio),
    service: ReviewService = Depends(get_review_service),
) -> NotificationsOut:
    items, unread = service.notifications(user, limit)
    return NotificationsOut(items=items, unread=unread)


@studio_router.post("/notifications/{notification_id}/read", status_code=204)
def mark_read(
    notification_id: uuid.UUID,
    user: CurrentUser = Depends(require_studio),
    service: ReviewService = Depends(get_review_service),
) -> Response:
    service.mark_read(user, notification_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@admin_router.get("/review-queue", response_model=Page[ReviewItemOut])
def review_queue(
    series_id: uuid.UUID | None = None,
    writer_id: uuid.UUID | None = None,
    params: PageParams = Depends(page_params),
    _: CurrentUser = Depends(require_admin),
    service: ReviewService = Depends(get_review_service),
    db: Session = Depends(get_db),
) -> Page[ReviewItemOut]:
    rows, total = paginate(
        db, service.queue_query(series_id=series_id, writer_id=writer_id), params
    )
    return make_page([service.item_out(r) for r in rows], total, params)


@admin_router.get("/review-items/{item_id}", response_model=ReviewDetailOut)
def review_detail(
    item_id: uuid.UUID,
    admin: CurrentUser = Depends(require_admin),
    service: ReviewService = Depends(get_review_service),
) -> ReviewDetailOut:
    return service.detail(admin, item_id)


@admin_router.post("/review-items/{item_id}/approve", response_model=ReviewItemOut)
def approve(
    item_id: uuid.UUID,
    body: ApproveIn,
    admin: CurrentUser = Depends(require_admin),
    service: ReviewService = Depends(get_review_service),
) -> ReviewItemOut:
    item = service.approve(admin, item_id, publish_now=body.publish_now, comments=body.comments)
    return service.item_out(item)


@admin_router.post("/review-items/{item_id}/request-changes", response_model=ReviewItemOut)
def request_changes(
    item_id: uuid.UUID,
    body: CommentsIn,
    admin: CurrentUser = Depends(require_admin),
    service: ReviewService = Depends(get_review_service),
) -> ReviewItemOut:
    return service.item_out(service.request_changes(admin, item_id, body.comments))


@admin_router.post("/review-items/{item_id}/reject", response_model=ReviewItemOut)
def reject(
    item_id: uuid.UUID,
    body: CommentsIn,
    admin: CurrentUser = Depends(require_admin),
    service: ReviewService = Depends(get_review_service),
) -> ReviewItemOut:
    return service.item_out(service.reject(admin, item_id, body.comments))


@admin_router.post("/episodes/{episode_id}/publish", status_code=204)
def publish(
    episode_id: uuid.UUID,
    admin: CurrentUser = Depends(require_admin),
    service: ReviewService = Depends(get_review_service),
) -> Response:
    service.publish(admin, episode_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@admin_router.post("/episodes/{episode_id}/unpublish", status_code=204)
def unpublish(
    episode_id: uuid.UUID,
    admin: CurrentUser = Depends(require_admin),
    service: ReviewService = Depends(get_review_service),
) -> Response:
    service.unpublish(admin, episode_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


routers = [studio_router, admin_router]
