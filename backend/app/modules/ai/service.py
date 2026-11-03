"""Entry point for every AI workflow: start, resume, cancel and execute (in a worker)."""

import logging
import uuid
from itertools import pairwise
from typing import TYPE_CHECKING, Annotated, Any, Literal

from langgraph.types import Command
from pydantic import BaseModel, Field, TypeAdapter, ValidationError
from sqlalchemy.orm import Session

from app.modules.ai.checkpointer import get_checkpointer
from app.modules.ai.engine import Deps, RunCancelled
from app.modules.ai.models import ACTIVE, RunStatus, WorkflowRun
from app.modules.ai.registry import get_builder
from app.modules.ai.runs import RunService
from app.modules.identity import CurrentUser
from app.modules.writing import EpisodeService, EpisodeStatus
from app.shared.errors import AppError, Conflict, ValidationFailed

if TYPE_CHECKING:
    from app.container import Container

logger = logging.getLogger(__name__)

RUN_JOB = "ai.run_workflow"
DRAFTABLE = frozenset(
    {EpisodeStatus.PLANNED, EpisodeStatus.DRAFTING, EpisodeStatus.CHANGES_REQUESTED}
)


class Section(BaseModel):
    start: int = Field(ge=0)
    end: int = Field(gt=0)
    note: str = Field(default="", max_length=2000)


class Approve(BaseModel):
    action: Literal["approve"]


class Edit(BaseModel):
    action: Literal["edit"]
    text: str = Field(min_length=1, max_length=200_000)


class Regenerate(BaseModel):
    action: Literal["regenerate"]
    sections: list[Section] = Field(min_length=1, max_length=20)


class Resolved(BaseModel):
    action: Literal["resolved"]


class Done(BaseModel):
    action: Literal["done"]


ReviewDecision = Annotated[Approve | Edit | Regenerate, Field(discriminator="action")]
RESUME_SCHEMAS: dict[str, TypeAdapter[Any]] = {
    "draft_review": TypeAdapter(ReviewDecision),
    "contradictions": TypeAdapter(Resolved),
    "canon_confirmation": TypeAdapter(Done),
}


def _validate_sections(sections: list[Section], text_length: int) -> None:
    ordered = sorted(sections, key=lambda s: s.start)
    for section in ordered:
        if section.end <= section.start or section.end > text_length:
            raise ValidationFailed("A selection is outside the current text", code="bad_section")
    for first, second in pairwise(ordered):
        if second.start < first.end:
            raise ValidationFailed("Selections overlap", code="bad_section")


class AIService:
    def __init__(self, db: Session, container: "Container") -> None:
        self.db = db
        self.container = container
        self.runs = RunService(db)
        self.episodes = EpisodeService(db, container)

    # Starting ------------------------------------------------------------------------------

    def _create_run(
        self,
        workflow: str,
        episode_id: uuid.UUID,
        series_id: uuid.UUID,
        user: CurrentUser,
        input: dict[str, Any] | None = None,
    ) -> WorkflowRun:
        run = self.runs.create(
            workflow=workflow,
            thread_id="pending",
            episode_id=episode_id,
            series_id=series_id,
            requested_by=user.id,
            input=input,
        )
        # One thread per episode, workflow and run, so a new run starts fresh while a paused
        # run resumes from its own checkpoint.
        run.thread_id = f"episode-{episode_id}:{workflow}:{run.id.hex[:12]}"
        return run

    def _enqueue(self, run: WorkflowRun, resume: dict[str, Any] | None = None) -> None:
        # Commit first so the worker can see the run.
        self.db.commit()
        self.container.queue.enqueue(RUN_JOB, run_id=str(run.id), resume=resume)

    def start_drafting(self, user: CurrentUser, episode_id: uuid.UUID) -> WorkflowRun:
        episode = self.episodes.get_for_user(user, episode_id)
        if episode.status not in DRAFTABLE:
            raise Conflict(
                f"An episode in status {episode.status.value} cannot be drafted",
                code="episode_not_draftable",
            )
        if not self.episodes.plan(episode_id).beats:
            raise Conflict("Add at least one beat before drafting", code="plan_has_no_beats")
        run = self._create_run("drafting", episode.id, episode.series_id, user)
        self._enqueue(run)
        return run

    def start_continuity(self, user: CurrentUser, episode_id: uuid.UUID) -> WorkflowRun:
        episode = self.episodes.get_for_user(user, episode_id)
        version, _ = self.episodes.current_text(episode_id)
        if version is None:
            raise Conflict("Write or draft the episode first", code="episode_has_no_text")
        run = self._create_run("continuity", episode.id, episode.series_id, user)
        self._enqueue(run)
        return run

    def regenerate_section(
        self, user: CurrentUser, episode_id: uuid.UUID, sections: list[Section]
    ) -> WorkflowRun:
        episode = self.episodes.get_for_user(user, episode_id)
        if episode.status == EpisodeStatus.IN_REVIEW:
            raise Conflict("The episode is being reviewed", code="episode_in_review")
        if self.runs.active_for(episode_id, "drafting"):
            raise Conflict(
                "Use the drafting run's review step to regenerate sections",
                code="workflow_already_active",
            )
        _, text = self.episodes.current_text(episode_id)
        _validate_sections(sections, len(text))
        run = self._create_run(
            "section_regen",
            episode.id,
            episode.series_id,
            user,
            input={"sections": [s.model_dump() for s in sections]},
        )
        self._enqueue(run)
        return run

    # Controlling ---------------------------------------------------------------------------

    def _load(self, user: CurrentUser, run_id: uuid.UUID) -> WorkflowRun:
        run = self.runs.get(run_id)
        if run.episode_id is None:
            raise ValidationFailed("This run has no episode")
        self.episodes.get_for_user(user, run.episode_id)  # 404 for other writers
        return run

    def resume(
        self, user: CurrentUser, run_id: uuid.UUID, payload: dict[str, Any] | None
    ) -> WorkflowRun:
        run = self._load(user, run_id)
        if run.status == RunStatus.FAILED:
            # Retry from the last checkpoint (the failed step runs again).
            self.runs.set_status(run, RunStatus.QUEUED)
            self._enqueue(run, resume=None)
            return run
        if run.status != RunStatus.WAITING or not run.interrupt_payload:
            raise Conflict("This run is not waiting for you", code="workflow_not_waiting")
        kind = run.interrupt_payload["kind"]
        try:
            decision = RESUME_SCHEMAS[kind].validate_python(payload or {})
        except ValidationError as exc:
            raise ValidationFailed(
                "This answer does not fit the step",
                code="invalid_resume",
                details={"errors": exc.errors(include_url=False, include_context=False)},
            ) from exc
        if isinstance(decision, Regenerate):
            _, text = self.episodes.current_text(run.episode_id)  # type: ignore[arg-type]
            _validate_sections(decision.sections, len(text))
        resume = {**decision.model_dump(), "user_id": str(user.id)}
        self.runs.set_status(run, RunStatus.QUEUED)
        self._enqueue(run, resume=resume)
        return run

    def cancel(self, user: CurrentUser, run_id: uuid.UUID) -> WorkflowRun:
        run = self._load(user, run_id)
        if run.status not in ACTIVE:
            raise Conflict("This run has finished", code="workflow_finished")
        self.runs.set_status(run, RunStatus.CANCELLED)
        return run

    # Executing (worker) --------------------------------------------------------------------

    def execute(self, run_id: uuid.UUID, resume: dict[str, Any] | None = None) -> None:
        run = self.runs.get(run_id)
        if run.status not in (RunStatus.QUEUED, RunStatus.RUNNING):
            logger.info("run_skipped", extra={"run_id": str(run_id), "status": run.status.value})
            return
        self.runs.set_status(run, RunStatus.RUNNING)
        self.db.commit()

        graph = get_builder(run.workflow)(
            Deps(self.container), get_checkpointer(self.container.settings.database_url)
        )
        config = {"configurable": {"thread_id": run.thread_id}}
        snapshot = graph.get_state(config)
        if resume is not None:
            graph_input: Any = Command(resume=resume)
        elif snapshot.next:  # retry after a failure: continue from the last checkpoint
            graph_input = None
        else:
            graph_input = {
                **run.input,
                "run_id": str(run.id),
                "episode_id": str(run.episode_id),
                "series_id": str(run.series_id),
            }

        try:
            graph.invoke(graph_input, config)
        except RunCancelled:
            self.db.rollback()
            return
        except Exception as exc:
            self.db.rollback()
            logger.exception("workflow_failed", extra={"run_id": str(run_id)})
            message = exc.message if isinstance(exc, AppError) else str(exc)
            code = getattr(exc, "code", type(exc).__name__)
            run = self.runs.get(run_id)
            if run.status != RunStatus.CANCELLED:
                self.runs.set_status(run, RunStatus.FAILED, error=f"{message} [{code}]")
                self.db.commit()
            return

        self.db.expire_all()
        run = self.runs.get(run_id)
        if run.status == RunStatus.CANCELLED:
            return
        interrupts = graph.get_state(config).interrupts
        if interrupts:
            self.runs.set_status(run, RunStatus.WAITING, interrupt=dict(interrupts[0].value))
        else:
            self.runs.set_status(run, RunStatus.SUCCEEDED)
        self.db.commit()
