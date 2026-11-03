"""Arq worker entry points, one per queue so voice work never blocks drafting.

Run with ``arq app.worker.DefaultWorker`` (or ``DraftingWorker`` / ``VoiceWorker``).
"""

import asyncio
from typing import Any

from arq.connections import RedisSettings
from arq.worker import Function, func

from app import job_modules  # noqa: F401  (registers every module's jobs)
from app.container import build_container
from app.shared.config import get_settings
from app.shared.jobs import (
    JOB_REGISTRY,
    QUEUE_DEFAULT,
    QUEUE_DRAFTING,
    QUEUE_VOICE,
    JobSpec,
)
from app.shared.logging import configure_logging


def _wrap(spec: JobSpec) -> Function:
    async def run(ctx: dict[str, Any], **kwargs: Any) -> Any:
        return await asyncio.to_thread(spec.fn, ctx["container"], **kwargs)

    return func(run, name=spec.name)


async def _startup(ctx: dict[str, Any]) -> None:
    settings = get_settings()
    configure_logging(settings.log_level)
    ctx["container"] = build_container(settings)


async def _shutdown(ctx: dict[str, Any]) -> None:
    ctx["container"].db.dispose()


def _redis_settings() -> RedisSettings:
    return RedisSettings.from_dsn(get_settings().redis_url or "redis://localhost:6379")


def _functions(queue: str) -> list[Function]:
    return [_wrap(spec) for spec in JOB_REGISTRY.values() if spec.queue == queue]


def _worker_settings(queue: str, *, max_jobs: int, cron_jobs: list[Any] | None = None) -> type:
    # Arq reads settings from the class's own __dict__, so each class gets every key directly.
    attrs: dict[str, Any] = {
        "queue_name": queue,
        "functions": _functions(queue),
        "cron_jobs": cron_jobs or [],
        "on_startup": _startup,
        "on_shutdown": _shutdown,
        "redis_settings": _redis_settings(),
        "job_timeout": 60 * 30,
        "max_tries": 3,
        "max_jobs": max_jobs,
    }
    return type(f"Worker[{queue}]", (), attrs)


DefaultWorker = _worker_settings(QUEUE_DEFAULT, max_jobs=10)
DraftingWorker = _worker_settings(QUEUE_DRAFTING, max_jobs=4)
VoiceWorker = _worker_settings(QUEUE_VOICE, max_jobs=2)
