import json
import time
import uuid
from collections.abc import Iterator
from datetime import date
from typing import Any

from fastapi import APIRouter, Depends, Header, Query, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.modules.ai.costs import CostService
from app.modules.ai.models import TERMINAL, RunStatus, WorkflowRun
from app.modules.ai.runs import RunService
from app.modules.ai.schemas import (
    AdminCostsOut,
    BudgetIn,
    BudgetOut,
    CostSummary,
    RunOut,
    SeriesCostOut,
)
from app.modules.ai.service import AIService, Section
from app.modules.catalog import CatalogService
from app.modules.identity import CurrentUser, require_admin, require_studio
from app.modules.writing import EpisodeService
from app.shared.db import get_db
from app.shared.ratelimit import rate_limit

studio_router = APIRouter(prefix="/studio", tags=["studio: ai runs and costs"])
admin_router = APIRouter(prefix="/admin", tags=["admin: costs"])

POLL_SECONDS = 0.5
HEARTBEAT_SECONDS = 15.0
MAX_STREAM_SECONDS = 30 * 60


def get_cost_service(request: Request, db: Session = Depends(get_db)) -> CostService:
    return CostService(db, request.app.state.container)


def run_out(run: WorkflowRun, costs: CostService) -> RunOut:
    out = RunOut.model_validate(run)
    out.cost_usd = costs.run_cost(run.id)
    return out


def load_run_for_user(
    request: Request, db: Session, user: CurrentUser, run_id: uuid.UUID
) -> WorkflowRun:
    run = RunService(db).get(run_id)
    if run.series_id is not None:
        CatalogService(db, request.app.state.container).get_series_for_user(user, run.series_id)
    elif not user.is_admin:
        RunService(db).get(uuid.uuid4())  # raises NotFound without revealing the run
    return run


@studio_router.get("/episodes/{episode_id}/workflow-runs", response_model=list[RunOut])
def list_runs(
    episode_id: uuid.UUID,
    request: Request,
    user: CurrentUser = Depends(require_studio),
    db: Session = Depends(get_db),
    costs: CostService = Depends(get_cost_service),
) -> list[RunOut]:
    EpisodeService(db, request.app.state.container).get_for_user(user, episode_id)
    return [run_out(r, costs) for r in RunService(db).list_for_episode(episode_id)]


@studio_router.get("/workflow-runs/{run_id}", response_model=RunOut)
def get_run(
    run_id: uuid.UUID,
    request: Request,
    user: CurrentUser = Depends(require_studio),
    db: Session = Depends(get_db),
    costs: CostService = Depends(get_cost_service),
) -> RunOut:
    return run_out(load_run_for_user(request, db, user, run_id), costs)


def _sse(event_id: int, event: str, data: dict[str, Any]) -> str:
    return f"id: {event_id}\nevent: {event}\ndata: {json.dumps(data, default=str)}\n\n"


@studio_router.get(
    "/workflow-runs/{run_id}/events",
    response_class=StreamingResponse,
    responses={200: {"content": {"text/event-stream": {}}}},
)
def stream_run_events(
    run_id: uuid.UUID,
    request: Request,
    after: int = Query(0, ge=0, description="Return events after this cursor"),
    last_event_id: int | None = Header(None, alias="Last-Event-ID"),
    user: CurrentUser = Depends(require_studio),
    db: Session = Depends(get_db),
) -> StreamingResponse:
    """Server-sent events with run progress. Closes when the run waits for the writer or ends;
    reconnect with ``Last-Event-ID`` (or ``after``) to continue."""
    load_run_for_user(request, db, user, run_id)
    database = request.app.state.container.db
    cursor = max(after, last_event_id or 0)

    def events() -> Iterator[str]:
        nonlocal cursor
        started = last_beat = time.monotonic()
        while time.monotonic() - started < MAX_STREAM_SECONDS:
            with database.session() as session:
                runs = RunService(session)
                rows = runs.events_after(run_id, cursor)
                status = runs.get(run_id).status
            for row in rows:
                cursor = row.id
                yield _sse(
                    row.id,
                    "progress",
                    {
                        "kind": row.kind,
                        "step": row.step,
                        "message": row.message,
                        "data": row.data,
                        "at": row.created_at.isoformat(),
                    },
                )
            if status in TERMINAL or status == RunStatus.WAITING:
                yield _sse(cursor, "end", {"status": status.value})
                return
            if time.monotonic() - last_beat > HEARTBEAT_SECONDS:
                last_beat = time.monotonic()
                yield ": keep-alive\n\n"
            time.sleep(POLL_SECONDS)

    return StreamingResponse(
        events(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


_ai_limit = rate_limit("ai-workflows", limit=30, window_seconds=60)


def get_ai_service(request: Request, db: Session = Depends(get_db)) -> AIService:
    return AIService(db, request.app.state.container)


class ResumeIn(BaseModel):
    """Answer for the step the run is waiting at, e.g. ``{"action": "approve"}``, or empty to
    retry a failed run."""

    payload: dict[str, Any] | None = None


class RegenerateIn(BaseModel):
    sections: list[Section] = Field(min_length=1, max_length=20)


@studio_router.post(
    "/episodes/{episode_id}/workflows/drafting",
    response_model=RunOut,
    status_code=202,
    dependencies=[Depends(_ai_limit)],
)
def start_drafting(
    episode_id: uuid.UUID,
    user: CurrentUser = Depends(require_studio),
    service: AIService = Depends(get_ai_service),
    costs: CostService = Depends(get_cost_service),
) -> RunOut:
    return run_out(service.start_drafting(user, episode_id), costs)


@studio_router.post(
    "/episodes/{episode_id}/regenerate-section",
    response_model=RunOut,
    status_code=202,
    dependencies=[Depends(_ai_limit)],
)
def regenerate_section(
    episode_id: uuid.UUID,
    body: RegenerateIn,
    user: CurrentUser = Depends(require_studio),
    service: AIService = Depends(get_ai_service),
    costs: CostService = Depends(get_cost_service),
) -> RunOut:
    return run_out(service.regenerate_section(user, episode_id, body.sections), costs)


@studio_router.post(
    "/workflow-runs/{run_id}/resume",
    response_model=RunOut,
    status_code=202,
    dependencies=[Depends(_ai_limit)],
)
def resume_run(
    run_id: uuid.UUID,
    body: ResumeIn,
    user: CurrentUser = Depends(require_studio),
    service: AIService = Depends(get_ai_service),
    costs: CostService = Depends(get_cost_service),
) -> RunOut:
    return run_out(service.resume(user, run_id, body.payload), costs)


@studio_router.post("/workflow-runs/{run_id}/cancel", response_model=RunOut)
def cancel_run(
    run_id: uuid.UUID,
    user: CurrentUser = Depends(require_studio),
    service: AIService = Depends(get_ai_service),
    costs: CostService = Depends(get_cost_service),
) -> RunOut:
    return run_out(service.cancel(user, run_id), costs)


@studio_router.get("/episodes/{episode_id}/costs", response_model=CostSummary)
def episode_costs(
    episode_id: uuid.UUID,
    user: CurrentUser = Depends(require_studio),
    costs: CostService = Depends(get_cost_service),
) -> CostSummary:
    return costs.episode_costs(user, episode_id)


@studio_router.get("/series/{series_id}/costs", response_model=SeriesCostOut)
def series_costs(
    series_id: uuid.UUID,
    user: CurrentUser = Depends(require_studio),
    costs: CostService = Depends(get_cost_service),
) -> SeriesCostOut:
    return costs.series_costs(user, series_id)


@admin_router.get("/costs", response_model=AdminCostsOut)
def admin_costs(
    from_date: date | None = Query(None, alias="from"),
    to_date: date | None = Query(None, alias="to"),
    group_by: str = Query("series", pattern="^(series|episode|purpose|model)$"),
    _: CurrentUser = Depends(require_admin),
    costs: CostService = Depends(get_cost_service),
) -> AdminCostsOut:
    return costs.admin_costs(from_date, to_date, group_by)


@admin_router.get("/series/{series_id}/budget", response_model=BudgetOut)
def get_budget(
    series_id: uuid.UUID,
    user: CurrentUser = Depends(require_admin),
    costs: CostService = Depends(get_cost_service),
) -> BudgetOut:
    return costs.series_costs(user, series_id).budget


@admin_router.put("/series/{series_id}/budget", response_model=BudgetOut)
def set_budget(
    series_id: uuid.UUID,
    body: BudgetIn,
    _: CurrentUser = Depends(require_admin),
    costs: CostService = Depends(get_cost_service),
) -> BudgetOut:
    return costs.set_budget(series_id, body.soft_limit_usd)


routers = [studio_router, admin_router]
