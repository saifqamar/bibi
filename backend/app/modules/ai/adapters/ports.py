"""Ports for AI providers. Modules depend on these, never on vendor SDKs."""

from dataclasses import dataclass, field
from typing import Any, Protocol

EMBEDDING_DIM = 1536


class ProviderError(Exception):
    """A provider call failed. ``retryable`` tells callers whether trying again can help."""

    def __init__(self, message: str, *, code: str, retryable: bool = False) -> None:
        super().__init__(message)
        self.code = code
        self.retryable = retryable


@dataclass(frozen=True)
class LLMMessage:
    role: str  # "user" | "assistant"
    content: str


@dataclass(frozen=True)
class LLMResult:
    text: str
    input_tokens: int
    output_tokens: int
    model: str
    provider: str
    data: dict[str, Any] | None = None  # parsed JSON when a json_schema was requested


@dataclass(frozen=True)
class EmbeddingResult:
    vectors: list[list[float]]
    tokens: int
    model: str
    provider: str


@dataclass(frozen=True)
class TTSResult:
    audio_wav: bytes
    characters: int
    model: str
    provider: str
    meta: dict[str, Any] = field(default_factory=dict)


class LLMPort(Protocol):
    def complete(
        self,
        *,
        system: str,
        messages: list[LLMMessage],
        max_tokens: int = 16000,
        json_schema: dict[str, Any] | None = None,
        task: str = "",
    ) -> LLMResult:
        """``task`` names the call (e.g. ``draft``); fakes use it to pick scripted replies."""
        ...


class EmbeddingPort(Protocol):
    def embed(self, texts: list[str]) -> EmbeddingResult: ...


class TTSPort(Protocol):
    def synthesize(self, text: str, voice_id: str, *, language: str = "en") -> TTSResult: ...
