"""Background jobs for AI workflows (drafting queue; never run inside a request)."""

import uuid
from typing import Any

from app.modules.ai.service import RUN_JOB, AIService
from app.shared.jobs import QUEUE_DRAFTING, job


@job(RUN_JOB, queue=QUEUE_DRAFTING)
def run_workflow_job(container: Any, *, run_id: str, resume: dict[str, Any] | None = None) -> None:
    with container.db.session() as db:
        AIService(db, container).execute(uuid.UUID(run_id), resume)
