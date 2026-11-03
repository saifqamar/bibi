import uuid
from datetime import date
from typing import Any

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.modules.analytics.service import AGGREGATE_JOB, AnalyticsService
from app.modules.identity import CurrentUser, require_admin
from app.shared.db import get_db

router = APIRouter(prefix="/admin/analytics", tags=["admin: analytics"])


def get_analytics(request: Request, db: Session = Depends(get_db)) -> AnalyticsService:
    return AnalyticsService(db, request.app.state.container)


@router.get("/overview")
def overview(
    from_date: date | None = Query(None, alias="from"),
    to_date: date | None = Query(None, alias="to"),
    _: CurrentUser = Depends(require_admin),
    analytics: AnalyticsService = Depends(get_analytics),
) -> dict[str, Any]:
    return analytics.overview(from_date, to_date)


@router.get("/series/{series_id}")
def series_stats(
    series_id: uuid.UUID,
    from_date: date | None = Query(None, alias="from"),
    to_date: date | None = Query(None, alias="to"),
    _: CurrentUser = Depends(require_admin),
    analytics: AnalyticsService = Depends(get_analytics),
) -> dict[str, Any]:
    return analytics.series_stats(series_id, from_date, to_date)


@router.get("/episodes/{episode_id}")
def episode_stats(
    episode_id: uuid.UUID,
    from_date: date | None = Query(None, alias="from"),
    to_date: date | None = Query(None, alias="to"),
    _: CurrentUser = Depends(require_admin),
    analytics: AnalyticsService = Depends(get_analytics),
) -> dict[str, Any]:
    return analytics.episode_stats(episode_id, from_date, to_date)


@router.get("/retention")
def retention(
    _: CurrentUser = Depends(require_admin),
    analytics: AnalyticsService = Depends(get_analytics),
) -> dict[str, float | None]:
    return analytics.retention()


@router.post("/refresh", status_code=202)
def refresh(request: Request, _: CurrentUser = Depends(require_admin)) -> dict[str, str]:
    """Queue an aggregation now instead of waiting for the 15-minute schedule."""
    return {"job_id": request.app.state.container.queue.enqueue(AGGREGATE_JOB)}


routers = [router]
