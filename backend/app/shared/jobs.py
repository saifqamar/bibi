"""Background job queue port.

Modules register sync job functions with ``@job(name, queue=...)``. The API only enqueues;
AI and TTS work never runs in the request cycle. ``ArqJobQueue`` sends jobs to Redis for the
Arq workers in ``app/worker.py``; ``InMemoryJobQueue`` records jobs so tests can run them
explicitly with ``run_pending()``.
"""

import asyncio
import threading
import uuid
from collections.abc import Callable
from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Any, Protocol

if TYPE_CHECKING:
    from app.container import Container

QUEUE_DEFAULT = "bibi:default"
QUEUE_DRAFTING = "bibi:drafting"
QUEUE_VOICE = "bibi:voice"
QUEUES = (QUEUE_DEFAULT, QUEUE_DRAFTING, QUEUE_VOICE)

JobFn = Callable[..., Any]


@dataclass(frozen=True)
class JobSpec:
    name: str
    queue: str
    fn: JobFn


JOB_REGISTRY: dict[str, JobSpec] = {}


def job(name: str, *, queue: str = QUEUE_DEFAULT) -> Callable[[JobFn], JobFn]:
    """Register ``fn(container, **kwargs)`` as a background job."""
    if queue not in QUEUES:
        raise ValueError(f"Unknown queue {queue}")

    def decorator(fn: JobFn) -> JobFn:
        JOB_REGISTRY[name] = JobSpec(name=name, queue=queue, fn=fn)
        return fn

    return decorator


class JobQueuePort(Protocol):
    def enqueue(self, name: str, **kwargs: Any) -> str: ...


@dataclass
class QueuedJob:
    id: str
    name: str
    queue: str
    kwargs: dict[str, Any] = field(default_factory=dict)


class InMemoryJobQueue:
    def __init__(self) -> None:
        self.jobs: list[QueuedJob] = []
        self.container: Container | None = None

    def enqueue(self, name: str, **kwargs: Any) -> str:
        spec = JOB_REGISTRY.get(name)
        if spec is None:
            raise KeyError(f"Unknown job {name}")
        queued = QueuedJob(id=uuid.uuid4().hex, name=name, queue=spec.queue, kwargs=kwargs)
        self.jobs.append(queued)
        return queued.id

    def run_pending(self, queue: str | None = None, *, max_rounds: int = 50) -> int:
        """Run queued jobs (including jobs they enqueue) and return how many ran."""
        if self.container is None:
            raise RuntimeError("InMemoryJobQueue has no container")
        ran = 0
        for _ in range(max_rounds):
            batch = [j for j in self.jobs if queue is None or j.queue == queue]
            if not batch:
                return ran
            for queued in batch:
                self.jobs.remove(queued)
                JOB_REGISTRY[queued.name].fn(self.container, **queued.kwargs)
                ran += 1
        raise RuntimeError("Jobs kept enqueueing more jobs; giving up")


class ArqJobQueue:
    """Enqueues to Arq from sync code using one background event loop."""

    def __init__(self, redis_url: str) -> None:
        self._redis_url = redis_url
        self._loop: asyncio.AbstractEventLoop | None = None
        self._pool: Any = None
        self._lock = threading.Lock()

    def _ensure_loop(self) -> asyncio.AbstractEventLoop:
        with self._lock:
            if self._loop is None:
                loop = asyncio.new_event_loop()
                threading.Thread(target=loop.run_forever, daemon=True, name="arq-enqueue").start()
                self._loop = loop
            return self._loop

    async def _enqueue(self, name: str, queue: str, kwargs: dict[str, Any]) -> str:
        from arq import create_pool
        from arq.connections import RedisSettings

        if self._pool is None:
            self._pool = await create_pool(RedisSettings.from_dsn(self._redis_url))
        job_id = uuid.uuid4().hex
        await self._pool.enqueue_job(name, _job_id=job_id, _queue_name=queue, **kwargs)
        return job_id

    def enqueue(self, name: str, **kwargs: Any) -> str:
        spec = JOB_REGISTRY.get(name)
        if spec is None:
            raise KeyError(f"Unknown job {name}")
        future = asyncio.run_coroutine_threadsafe(
            self._enqueue(name, spec.queue, kwargs), self._ensure_loop()
        )
        return future.result(timeout=10)
