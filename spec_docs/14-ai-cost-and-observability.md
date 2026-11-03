# 14. AI Cost Tracking and Observability

**Modules:** `ai`, `analytics`, `shared` · **Scope:** MVP

## Goal
Know what each episode costs, trace AI behaviour, and see failures quickly.

## Functional requirements
1. **Usage records:** every LLM, embedding and TTS call writes `ai_usage` (provider, model, input/output tokens, TTS characters, cost) linked to `workflow_run` and episode. Done in one place (adapter wrapper), not per call site.
2. **Cost calculation** from a configurable price table; changing prices does not rewrite history.
3. **Views (admin):** cost per episode and per series; split by drafting, continuity, embeddings, TTS; totals by date range. Cost per finished listening minute as a derived metric.
4. **Budgets:** optional per-series soft limit with warning in Studio. **[OPEN]**
5. **Workflow runs:** `workflow_runs` records status, timing and error; writers and admins can see run history per episode.
6. **LLM tracing:** traces for every graph run (for example Langfuse), including prompts, outputs, latency and cost, linked by `workflow_run_id`.
7. **Error monitoring** (for example Sentry) on all apps; **structured logs** with request ids.
8. Adapter-level retries, timeouts and clear error codes for provider failures.

## Acceptance criteria
- Running a drafting workflow with a fake LLM produces usage rows that sum to the episode total.
- Episode cost in the admin view matches the sum of its usage rows.
- A failed run shows its error in Studio and in monitoring with the same request id.

## Open items
- Tracing and monitoring vendors; budget behaviour.
