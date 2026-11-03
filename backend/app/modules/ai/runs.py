"""Workflow-run bookkeeping: status, progress events for the live stream, and history."""

import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.ai.models import ACTIVE, TERMINAL, RunStatus, WorkflowRun, WorkflowRunEvent
from app.shared.errors import Conflict, NotFound
from app.shared.logging import get_request_id


def _now() -> datetime:
    return datetime.now(UTC)


class RunService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get(self, run_id: uuid.UUID) -> WorkflowRun:
        run = self.db.get(WorkflowRun, run_id)
        if run is None:
            raise NotFound("Workflow run not found")
        return run

    def active_for(self, episode_id: uuid.UUID, workflow: str) -> WorkflowRun | None:
        return self.db.scalar(
            select(WorkflowRun).where(
                WorkflowRun.episode_id == episode_id,
                WorkflowRun.workflow == workflow,
                WorkflowRun.status.in_(ACTIVE),
            )
        )

    def create(
        self,
        *,
        workflow: str,
        thread_id: str,
        episode_id: uuid.UUID | None,
        series_id: uuid.UUID | None,
        requested_by: uuid.UUID | None,
        input: dict[str, Any] | None = None,
        exclusive: bool = True,
    ) -> WorkflowRun:
        if exclusive and episode_id and self.active_for(episode_id, workflow):
            raise Conflict(
                f"A {workflow} run is already active for this episode",
                code="workflow_already_active",
            )
        run = WorkflowRun(
            workflow=workflow,
            thread_id=thread_id,
            episode_id=episode_id,
            series_id=series_id,
            requested_by=requested_by,
            input=input or {},
            request_id=get_request_id(),
        )
        self.db.add(run)
        self.db.flush()
        self.event(run, "status", message="queued", data={"status": RunStatus.QUEUED.value})
        return run

    def event(
        self,
        run: WorkflowRun,
        kind: str,
        *,
        step: str = "",
        message: str = "",
        data: dict[str, Any] | None = None,
    ) -> WorkflowRunEvent:
        row = WorkflowRunEvent(
            workflow_run_id=run.id, kind=kind, step=step, message=message, data=data or {}
        )
        self.db.add(row)
        self.db.flush()
        return row

    def step(self, run: WorkflowRun, step: str, message: str = "") -> None:
        run.current_step = step
        self.event(run, "step", step=step, message=message or step.replace("_", " "))

    def set_status(
        self,
        run: WorkflowRun,
        status: RunStatus,
        *,
        error: str | None = None,
        interrupt: dict[str, Any] | None = None,
    ) -> None:
        if run.status in TERMINAL and status != RunStatus.RUNNING:
            raise Conflict("This run has finished", code="workflow_finished")
        run.status = status
        if status == RunStatus.RUNNING and run.started_at is None:
            run.started_at = _now()
        if status in TERMINAL:
            run.finished_at = _now()
        run.error = error if status == RunStatus.FAILED else None
        run.interrupt_payload = interrupt if status == RunStatus.WAITING else None
        data: dict[str, Any] = {"status": status.value}
        if interrupt:
            data["interrupt"] = interrupt
        if error:
            data["error"] = error
        self.event(run, "status", step=run.current_step, message=status.value, data=data)

    def list_for_episode(self, episode_id: uuid.UUID) -> list[WorkflowRun]:
        return list(
            self.db.scalars(
                select(WorkflowRun)
                .where(WorkflowRun.episode_id == episode_id)
                .order_by(WorkflowRun.created_at.desc())
            )
        )

    def events_after(self, run_id: uuid.UUID, after: int) -> list[WorkflowRunEvent]:
        return list(
            self.db.scalars(
                select(WorkflowRunEvent)
                .where(WorkflowRunEvent.workflow_run_id == run_id, WorkflowRunEvent.id > after)
                .order_by(WorkflowRunEvent.id)
            )
        )
