"""Deterministic fake adapters for tests and local development (no API keys needed)."""

import hashlib
import io
import json
import math
import wave
from array import array
from collections.abc import Callable
from typing import Any

from app.modules.ai.adapters.ports import (
    EMBEDDING_DIM,
    EmbeddingResult,
    LLMMessage,
    LLMResult,
    ProviderError,
    TTSResult,
)

Responder = Callable[[str, list[LLMMessage], dict[str, Any] | None], str | dict[str, Any]]


def _tokens(text: str) -> int:
    return max(1, len(text) // 4)


class FakeLLM:
    """Replies come from ``responders[task]`` (a string, dict or callable); otherwise an echo.

    ``fail_next`` makes the next N calls raise a retryable ProviderError (for retry tests).
    """

    model = "fake-llm"
    provider = "fake"

    def __init__(self, responders: dict[str, Any] | None = None) -> None:
        self.responders: dict[str, Any] = dict(responders or {})
        self.calls: list[dict[str, Any]] = []
        self.fail_next = 0
        self.fail_with: ProviderError | None = None

    def complete(
        self,
        *,
        system: str,
        messages: list[LLMMessage],
        max_tokens: int = 16000,
        json_schema: dict[str, Any] | None = None,
        task: str = "",
    ) -> LLMResult:
        self.calls.append({"task": task, "system": system, "messages": messages})
        if self.fail_with is not None:
            raise self.fail_with
        if self.fail_next > 0:
            self.fail_next -= 1
            raise ProviderError("fake overload", code="overloaded", retryable=True)
        responder = self.responders.get(task)
        reply: Any
        if callable(responder):
            reply = responder(system, messages, json_schema)
        elif responder is not None:
            reply = responder
        elif json_schema is not None:
            reply = {}
        else:
            reply = f"[fake {task or 'reply'}] {messages[-1].content[:200] if messages else ''}"
        data = reply if isinstance(reply, dict | list) else None
        text = json.dumps(reply) if data is not None else str(reply)
        prompt = system + "".join(m.content for m in messages)
        return LLMResult(
            text=text,
            input_tokens=_tokens(prompt),
            output_tokens=_tokens(text),
            model=self.model,
            provider=self.provider,
            data=data,  # type: ignore[arg-type]
        )


class FakeEmbedding:
    """Hash-based unit vectors: identical texts embed identically; similar texts do not."""

    model = "fake-embedding"
    provider = "fake"

    def embed(self, texts: list[str]) -> EmbeddingResult:
        vectors = []
        for text in texts:
            # Bag of hashed words, so texts sharing words point in similar directions.
            vector = [0.0] * EMBEDDING_DIM
            for word in text.lower().split():
                digest = hashlib.sha256(word.encode()).digest()
                index = int.from_bytes(digest[:4], "big") % EMBEDDING_DIM
                vector[index] += 1.0 if digest[4] % 2 else -1.0
            norm = math.sqrt(sum(v * v for v in vector)) or 1.0
            vectors.append([v / norm for v in vector])
        return EmbeddingResult(
            vectors=vectors,
            tokens=sum(_tokens(t) for t in texts),
            model=self.model,
            provider=self.provider,
        )


SAMPLE_RATE = 24_000  # matches the audio module's standard PCM, so no resampling
CHARS_PER_SECOND = 15.0


def tone_wav(seconds: float, frequency: float = 220.0, amplitude: float = 0.3) -> bytes:
    """Mono 16-bit PCM sine wave, built from one repeated cycle so long clips stay fast."""
    frames = int(seconds * SAMPLE_RATE)
    period = max(2, round(SAMPLE_RATE / frequency))
    peak = int(32767 * amplitude)
    cycle = array("h", (int(peak * math.sin(2 * math.pi * i / period)) for i in range(period)))
    repeats = frames // period + 1
    samples = (cycle * repeats)[:frames]
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(SAMPLE_RATE)
        wav.writeframes(samples.tobytes())
    return buffer.getvalue()


class FakeTTS:
    """A tone whose length follows the text (about 15 characters per second) and whose pitch
    depends on the voice, so different voices are distinguishable in tests."""

    model = "fake-tts"
    provider = "fake"

    def __init__(self) -> None:
        self.calls: list[tuple[str, str]] = []
        self.fail_texts: set[str] = set()

    def synthesize(self, text: str, voice_id: str, *, language: str = "en") -> TTSResult:
        self.calls.append((text, voice_id))
        if text in self.fail_texts:
            raise ProviderError("fake synthesis failure", code="tts_failed", retryable=True)
        pitch = 160 + int(hashlib.sha256(voice_id.encode()).hexdigest()[:2], 16)
        seconds = max(0.3, len(text) / CHARS_PER_SECOND)
        return TTSResult(
            audio_wav=tone_wav(seconds, frequency=pitch),
            characters=len(text),
            model=self.model,
            provider=self.provider,
        )
