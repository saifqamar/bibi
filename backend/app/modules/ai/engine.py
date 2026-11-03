"""Shared plumbing for workflow graphs: per-node sessions, progress events and cancellation."""

import uuid
from collections.abc import Callable, Iterator
from contextlib import contextmanager
from dataclasses import dataclass
from functools import wraps
from typing import TYPE_CHECKING, Any

from langgraph.types import RetryPolicy
from sqlalchemy.orm import Session

from app.modules.ai.adapters.ports import ProviderError
from app.modules.ai.metering import Metered, UsageContext
from app.modules.ai.models import RunStatus, WorkflowRun
from app.modules.ai.runs import RunService

if TYPE_CHECKING:
    from app.container import Container


class RunCancelled(Exception):
    """Raised inside a node when the writer cancelled the run."""


def _retryable(exc: Exception) -> bool:
    return isinstance(exc, ProviderError) and exc.retryable


# Metered calls already retry provider errors; this re-runs the whole node a couple more times.
NODE_RETRY = RetryPolicy(max_attempts=2, initial_interval=2.0, retry_on=_retryable)


@dataclass
class Deps:
    container: "Container"

    @contextmanager
    def session(self) -> Iterator[Session]:
        """A session per node; committed when the node succeeds so progress survives failures."""
        session = self.container.db.session()
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    def metered(self, db: Session, state: dict[str, Any], purpose: str) -> Metered:
        return Metered(
            db,
            self.container,
            UsageContext(
                purpose=purpose,
                workflow_run_id=uuid.UUID(state["run_id"]),
                episode_id=uuid.UUID(state["episode_id"]) if state.get("episode_id") else None,
                series_id=uuid.UUID(state["series_id"]) if state.get("series_id") else None,
            ),
        )


NodeFn = Callable[[Deps, dict[str, Any]], dict[str, Any]]


def node(deps: Deps, name: str, fn: NodeFn) -> Any:
    """Wraps a node: stops if the run was cancelled and records a progress step."""

    @wraps(fn)
    def wrapped(state: dict[str, Any]) -> dict[str, Any]:
        with deps.session() as db:
            runs = RunService(db)
            run: WorkflowRun = runs.get(uuid.UUID(state["run_id"]))
            if run.status == RunStatus.CANCELLED:
                raise RunCancelled()
            runs.step(run, name)
        return fn(deps, state)

    return wrapped
