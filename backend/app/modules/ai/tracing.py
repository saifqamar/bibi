"""LLM tracing port. A Langfuse (or OpenTelemetry) adapter can implement the same interface once
the tracing vendor is chosen; until then spans go to the structured logs."""

import logging
import time
import uuid
from collections.abc import Iterator
from contextlib import contextmanager
from typing import Any, Protocol

logger = logging.getLogger("bibi.ai.trace")


class TracerPort(Protocol):
    def span(
        self, name: str, *, run_id: uuid.UUID | None, attrs: dict[str, Any] | None = None
    ) -> Any: ...


class NoopTracer:
    @contextmanager
    def span(
        self, name: str, *, run_id: uuid.UUID | None, attrs: dict[str, Any] | None = None
    ) -> Iterator[dict[str, Any]]:
        yield {}


class LoggingTracer:
    """Logs one structured line per span with its duration and any attributes added inside it."""

    @contextmanager
    def span(
        self, name: str, *, run_id: uuid.UUID | None, attrs: dict[str, Any] | None = None
    ) -> Iterator[dict[str, Any]]:
        extra: dict[str, Any] = dict(attrs or {})
        started = time.perf_counter()
        status = "ok"
        try:
            yield extra
        except Exception:
            status = "error"
            raise
        finally:
            logger.info(
                "ai_span",
                extra={
                    "span": name,
                    "workflow_run_id": str(run_id) if run_id else None,
                    "status": status,
                    "duration_ms": round((time.perf_counter() - started) * 1000, 1),
                    **extra,
                },
            )
