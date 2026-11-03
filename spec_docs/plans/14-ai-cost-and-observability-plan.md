# Plan 14: AI Cost Tracking and Observability

Spec: [14-ai-cost-and-observability.md](../14-ai-cost-and-observability.md) · Order: 6 · Depends on: plans 15, 04

## Goal
The AI module foundation: ports for LLM, embeddings and TTS; one place that records usage and cost; workflow-run bookkeeping with live progress; tracing and error monitoring hooks; admin cost views.

## Design
- **Ports (`ai/adapters/ports.py`):** `LLMPort.complete(system, messages, *, max_tokens, json_schema=None) → LLMResult(text, input_tokens, output_tokens, model)`, `EmbeddingPort.embed(texts) → (vectors, tokens, model)`, `TTSPort.synthesize(text, voice_id, *, language) → TTSResult(audio_wav bytes, characters)`.
- **Adapters:** `FakeLLM` (scripted/deterministic responses keyed by task), `AnthropicLLM` (official SDK, model from config), `FakeEmbedding` (deterministic hash vectors, dim 1536), `FakeTTS` (sine/silence WAV sized to text length). Provider selection from settings in `container.py`.
- **Metering:** `MeteredLLM/MeteredEmbedding/MeteredTTS` wrappers take a `UsageContext(workflow_run_id, episode_id, series_id, purpose)` and write `ai_usage` rows; adapters themselves never touch the DB.
- **Pricing:** `ai_prices(provider, model, unit [input_token|output_token|tts_char|embedding_token], usd_per_million, effective_from)`; cost computed at write time and stored on the usage row, so price changes do not rewrite history.
- **Tables:** `workflow_runs(id, thread_id, workflow, episode_id, series_id, status [queued|running|waiting|succeeded|failed|cancelled], current_step, interrupt_payload jsonb, started_at, finished_at, error, requested_by)`, `workflow_run_events(id, workflow_run_id, kind, step, message, data jsonb, created_at)`, `ai_usage(id, workflow_run_id null, episode_id, series_id, purpose, provider, model, input_tokens, output_tokens, tts_characters, embedding_tokens, cost_usd numeric)`.
- **Runs service:** create, transition, append event, list per episode; SSE endpoint polls `workflow_run_events` after a cursor and streams `event: progress` messages until the run is terminal.
- **Tracing:** `TracerPort.span(name, run_id, attrs)` with `LoggingTracer` (structured logs) and `NoopTracer`; Langfuse adapter deferred until the vendor is chosen.
- **Error monitoring:** Sentry SDK initialised in API and worker only when `SENTRY_DSN` is set; request id attached as a tag.
- **Adapter resilience:** timeouts and retry with exponential backoff for retryable provider errors; failures raise `ProviderError(code)`.
- **Budgets:** optional `series_budgets(series_id, soft_limit_usd)`; Studio shows a warning when the total passes it ([OPEN] default: warn only).

## API
- `GET /studio/episodes/{id}/workflow-runs`, `GET /studio/workflow-runs/{id}`, `GET /studio/workflow-runs/{id}/events` (SSE)
- `GET /studio/series/{id}/costs` (writer sees own), `GET /studio/episodes/{id}/costs`
- `GET /admin/costs?from=&to=&group_by=series|episode|purpose`, `GET/PUT /admin/series/{id}/budget`
- Derived metric "cost per finished listening minute" is returned by `/admin/costs` once plan 12 provides completed minutes (null until then).

## Tasks (one commit each)
1. Ports and fake adapters.
2. Anthropic LLM adapter (config-selected) with retry/timeouts.
3. Tables, migration, price table seed.
4. Metered wrappers writing `ai_usage` with computed cost.
5. Workflow-runs service and events; SSE endpoint.
6. Cost endpoints (studio and admin) and budgets.
7. Tracer port, logging tracer; Sentry init.
8. Studio: run history and cost panel on the episode page; budget warning.
9. Regenerate API client; tests.

## Tests
- Metered fake LLM call writes one usage row with correct tokens and cost; several calls sum to the episode total shown by `/studio/episodes/{id}/costs`.
- Price change after a call leaves existing costs unchanged.
- SSE endpoint streams events in order and closes on terminal status.
- Writer cannot read another writer's costs; admin can.
- Retry wrapper retries retryable errors and stops on non-retryable ones.
- Anthropic adapter is only imported by `container.py` when selected (import-linter keeps the SDK inside adapters).

## Spec coverage review

| Spec item | Covered by | Status |
| --------- | ---------- | ------ |
| FR1 usage rows for LLM, embedding, TTS in one place | Tasks 1, 4 | ✅ |
| FR2 configurable prices, history unchanged | Tasks 3, 4 | ✅ |
| FR3 admin cost views per episode/series, split by purpose, date range | Task 6 | ✅ |
| FR3 cost per finished listening minute | Task 6 returns it once plan 12 lands | ➡️ plan 12 |
| FR4 budgets [OPEN] | Task 6, warn-only default | ⚠️ confirm with owner |
| FR5 workflow runs visible per episode | Tasks 5, 8 | ✅ |
| FR6 LLM tracing linked to run | Task 7 (logging tracer; Langfuse adapter after vendor choice) | ⚠️ vendor open |
| FR7 Sentry + structured logs with request ids | Task 7 + plan 15 | ✅ |
| FR8 retries, timeouts, error codes | Task 2 | ✅ |
| AC fake run usage sums to episode total | Task 4/6 tests; full graph run in plan 05 | ✅ |
| AC admin episode cost = sum of rows | Task 6 test | ✅ |
| AC failed run error visible with request id | Tasks 5, 7 | ✅ |

Review result: complete. Gap fixed during review: the spec did not say where per-episode progress for the SSE stream comes from; added `workflow_run_events`.
