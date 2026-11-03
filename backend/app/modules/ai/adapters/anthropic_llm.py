"""Claude adapter for LLMPort (official Anthropic SDK); the only module importing anthropic."""

import json
from typing import Any

import anthropic

from app.modules.ai.adapters.ports import LLMMessage, LLMResult, ProviderError

# Server-side refusal fallback: on a safety decline the API re-runs the request on Anthropic's
# recommended fallback model inside the same call.
FALLBACK_BETA = "server-side-fallback-2026-07-01"


class AnthropicLLM:
    provider = "anthropic"

    def __init__(
        self,
        *,
        model: str = "claude-opus-5-5",
        effort: str = "high",
        api_key: str | None = None,
        timeout_seconds: float = 600.0,
        max_retries: int = 3,
        use_fallbacks: bool = True,
        client: Any = None,
    ) -> None:
        self.model = model
        self.effort = effort
        self.use_fallbacks = use_fallbacks
        # api_key=None lets the SDK resolve ANTHROPIC_API_KEY or another configured credential.
        self._client = client or anthropic.Anthropic(
            api_key=api_key, timeout=timeout_seconds, max_retries=max_retries
        )

    def complete(
        self,
        *,
        system: str,
        messages: list[LLMMessage],
        max_tokens: int = 16000,
        json_schema: dict[str, Any] | None = None,
        task: str = "",
    ) -> LLMResult:
        # Claude Opus 5.5 always thinks; effort is the depth control and defaults to medium,
        # so it is set explicitly.
        output_config: dict[str, Any] = {"effort": self.effort}
        if json_schema is not None:
            output_config["format"] = {"type": "json_schema", "schema": json_schema}
        params: dict[str, Any] = {
            "model": self.model,
            "max_tokens": max_tokens,
            "system": system,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
            "output_config": output_config,
        }
        if self.use_fallbacks:
            params["betas"] = [FALLBACK_BETA]
            params["fallbacks"] = "default"
        try:
            # Streaming avoids HTTP timeouts on long drafts.
            with self._client.beta.messages.stream(**params) as stream:
                response = stream.get_final_message()
        except anthropic.RateLimitError as exc:
            raise ProviderError(str(exc), code="rate_limited", retryable=True) from exc
        except (anthropic.BadRequestError, anthropic.UnprocessableEntityError) as exc:
            raise ProviderError(str(exc), code="bad_request") from exc
        except (anthropic.AuthenticationError, anthropic.PermissionDeniedError) as exc:
            raise ProviderError(str(exc), code="provider_auth") from exc
        except anthropic.NotFoundError as exc:
            raise ProviderError(str(exc), code="model_not_found") from exc
        except anthropic.APIStatusError as exc:
            retryable = exc.status_code >= 500 or exc.status_code in (408, 409, 429)
            raise ProviderError(str(exc), code="provider_error", retryable=retryable) from exc
        except (anthropic.APITimeoutError, anthropic.APIConnectionError) as exc:
            raise ProviderError(str(exc), code="provider_unreachable", retryable=True) from exc

        if response.stop_reason == "refusal":
            category = getattr(response.stop_details, "category", None)
            raise ProviderError(
                f"The model declined this request ({category or 'no category'})", code="refused"
            )
        if response.stop_reason == "max_tokens":
            raise ProviderError("The reply was cut off at max_tokens", code="output_truncated")

        text = "".join(
            getattr(block, "text", "") for block in response.content if block.type == "text"
        )
        data = json.loads(text) if json_schema is not None else None
        usage = response.usage
        input_tokens = (
            usage.input_tokens
            + (usage.cache_creation_input_tokens or 0)
            + (usage.cache_read_input_tokens or 0)
        )
        return LLMResult(
            text=text,
            input_tokens=input_tokens,
            output_tokens=usage.output_tokens,
            model=response.model,  # may be the fallback model after a refusal
            provider=self.provider,
            data=data,
        )
