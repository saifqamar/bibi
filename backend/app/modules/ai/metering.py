"""Metered wrappers: every LLM, embedding and TTS call records usage and cost in one place.

Adapters never touch the database; these wrappers do, using the caller's session.
"""

import time
import uuid
from collections.abc import Callable
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any

from sqlalchemy.orm import Session

from app.modules.ai.adapters.ports import (
    EmbeddingResult,
    LLMMessage,
    LLMResult,
    ProviderError,
    TTSResult,
)
from app.modules.ai.models import AIUsage
from app.modules.ai.pricing import compute_cost

if TYPE_CHECKING:
    from app.container import Container


@dataclass(frozen=True)
class UsageContext:
    purpose: str
    workflow_run_id: uuid.UUID | None = None
    episode_id: uuid.UUID | None = None
    series_id: uuid.UUID | None = None


def call_with_retry[T](
    fn: Callable[[], T], *, attempts: int = 3, base_delay: float = 0.5, sleep: Any = time.sleep
) -> T:
    """Retries retryable ProviderErrors with exponential backoff; others raise at once."""
    for attempt in range(attempts):
        try:
            return fn()
        except ProviderError as exc:
            if not exc.retryable or attempt == attempts - 1:
                raise
            sleep(base_delay * (2**attempt))
    raise AssertionError("unreachable")


class Metered:
    def __init__(
        self, db: Session, container: "Container", context: UsageContext, *, retry_sleep: Any = None
    ) -> None:
        self.db = db
        self.container = container
        self.context = context
        self._sleep = retry_sleep if retry_sleep is not None else container.retry_sleep

    def _record(self, provider: str, model: str, **amounts: int) -> AIUsage:
        row = AIUsage(
            workflow_run_id=self.context.workflow_run_id,
            episode_id=self.context.episode_id,
            series_id=self.context.series_id,
            purpose=self.context.purpose,
            provider=provider,
            model=model,
            cost_usd=compute_cost(self.db, provider, model, **amounts),
            **amounts,
        )
        self.db.add(row)
        self.db.flush()
        return row

    def complete(
        self,
        *,
        system: str,
        messages: list[LLMMessage],
        max_tokens: int = 16000,
        json_schema: dict[str, Any] | None = None,
        task: str = "",
    ) -> LLMResult:
        with self.container.tracer.span(
            f"llm.{task or 'complete'}", run_id=self.context.workflow_run_id
        ) as span:
            result = call_with_retry(
                lambda: self.container.llm.complete(
                    system=system,
                    messages=messages,
                    max_tokens=max_tokens,
                    json_schema=json_schema,
                    task=task,
                ),
                sleep=self._sleep,
            )
            row = self._record(
                result.provider,
                result.model,
                input_tokens=result.input_tokens,
                output_tokens=result.output_tokens,
            )
            span.update(
                model=result.model,
                input_tokens=result.input_tokens,
                output_tokens=result.output_tokens,
                cost_usd=str(row.cost_usd),
            )
        return result

    def embed(self, texts: list[str]) -> EmbeddingResult:
        result = call_with_retry(lambda: self.container.embedding.embed(texts), sleep=self._sleep)
        self._record(result.provider, result.model, embedding_tokens=result.tokens)
        return result

    def synthesize(self, text: str, voice_id: str, *, language: str = "en") -> TTSResult:
        result = call_with_retry(
            lambda: self.container.tts.synthesize(text, voice_id, language=language),
            sleep=self._sleep,
        )
        self._record(result.provider, result.model, tts_characters=result.characters)
        return result
