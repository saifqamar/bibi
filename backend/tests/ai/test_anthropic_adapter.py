"""The Claude adapter, exercised against a stand-in client (no network, no API key)."""

from contextlib import contextmanager
from types import SimpleNamespace
from typing import Any

import anthropic
import httpx
import pytest

from app.modules.ai.adapters.anthropic_llm import FALLBACK_BETA, AnthropicLLM
from app.modules.ai.adapters.ports import LLMMessage, ProviderError


def _message(text: str, stop_reason: str = "end_turn", model: str = "claude-opus-5-5") -> Any:
    return SimpleNamespace(
        content=[
            SimpleNamespace(type="thinking", thinking=""),
            SimpleNamespace(type="text", text=text),
        ],
        stop_reason=stop_reason,
        stop_details=SimpleNamespace(category="cyber") if stop_reason == "refusal" else None,
        model=model,
        usage=SimpleNamespace(
            input_tokens=100,
            output_tokens=40,
            cache_creation_input_tokens=10,
            cache_read_input_tokens=5,
        ),
    )


class StubClient:
    def __init__(self, result: Any) -> None:
        self.result = result
        self.params: dict[str, Any] = {}
        self.beta = SimpleNamespace(messages=SimpleNamespace(stream=self._stream))

    @contextmanager
    def _stream(self, **params: Any) -> Any:
        self.params = params
        if isinstance(self.result, Exception):
            raise self.result
        yield SimpleNamespace(get_final_message=lambda: self.result)


def _status_error(cls: type[anthropic.APIStatusError], status: int) -> anthropic.APIStatusError:
    request = httpx.Request("POST", "https://api.anthropic.com/v1/messages")
    response = httpx.Response(status, request=request)
    return cls("boom", response=response, body=None)


def test_request_shape_and_usage() -> None:
    client = StubClient(_message("Once upon a time"))
    llm = AnthropicLLM(effort="high", client=client)
    result = llm.complete(system="sys", messages=[LLMMessage("user", "hi")], max_tokens=1234)
    assert result.text == "Once upon a time"
    assert result.input_tokens == 115 and result.output_tokens == 40
    assert result.provider == "anthropic" and result.model == "claude-opus-5-5"
    params = client.params
    assert params["model"] == "claude-opus-5-5"
    assert params["max_tokens"] == 1234
    assert params["output_config"] == {"effort": "high"}
    assert params["betas"] == [FALLBACK_BETA] and params["fallbacks"] == "default"
    assert "thinking" not in params  # Opus 5.5 thinks adaptively by default


def test_structured_output() -> None:
    client = StubClient(_message('{"issues": []}'))
    schema = {"type": "object", "properties": {"issues": {"type": "array"}}}
    result = AnthropicLLM(client=client).complete(
        system="s", messages=[LLMMessage("user", "x")], json_schema=schema
    )
    assert result.data == {"issues": []}
    assert client.params["output_config"]["format"] == {"type": "json_schema", "schema": schema}


def test_fallback_model_is_reported() -> None:
    client = StubClient(_message("ok", model="claude-opus-4-8"))
    assert AnthropicLLM(client=client).complete(system="s", messages=[]).model == "claude-opus-4-8"


@pytest.mark.parametrize(
    "stop_reason,code", [("refusal", "refused"), ("max_tokens", "output_truncated")]
)
def test_unusable_stop_reasons(stop_reason: str, code: str) -> None:
    llm = AnthropicLLM(client=StubClient(_message("", stop_reason=stop_reason)))
    with pytest.raises(ProviderError) as exc:
        llm.complete(system="s", messages=[])
    assert exc.value.code == code and exc.value.retryable is False


@pytest.mark.parametrize(
    "error,code,retryable",
    [
        (_status_error(anthropic.RateLimitError, 429), "rate_limited", True),
        (_status_error(anthropic.InternalServerError, 500), "provider_error", True),
        (_status_error(anthropic.BadRequestError, 400), "bad_request", False),
        (_status_error(anthropic.AuthenticationError, 401), "provider_auth", False),
        (_status_error(anthropic.NotFoundError, 404), "model_not_found", False),
    ],
)
def test_error_mapping(error: Exception, code: str, retryable: bool) -> None:
    llm = AnthropicLLM(client=StubClient(error))
    with pytest.raises(ProviderError) as exc:
        llm.complete(system="s", messages=[])
    assert (exc.value.code, exc.value.retryable) == (code, retryable)


def test_fallbacks_can_be_turned_off() -> None:
    client = StubClient(_message("ok"))
    AnthropicLLM(client=client, use_fallbacks=False).complete(system="s", messages=[])
    assert "fallbacks" not in client.params and "betas" not in client.params
