# Decisions and Deviations

Records every deviation from `BIBI_SPEC.md` / `spec_docs/`, every `[CHECK]` item verified, and every default taken for an `[OPEN]` item. Newest entries at the bottom of each section.

## Owner decisions (3 Nov 2026)
- Scope: backend + Studio first, then mobile app and website. Spec 16 is plan-only.
- Queue: **Arq** (Redis), resolving open question 8.
- AI providers: ports with fake adapters for tests, an Anthropic LLM adapter, TTS provider configurable (open question 5 still open for the production choice).
- Git: one PR per plan from `dev`, squash merged.

## Deviations from the spec
| # | Spec says | We do | Why |
| - | --------- | ----- | --- |
| D1 | Storage port under `ai/adapters` (spec 7.1) | `StoragePort`, `EmailPort`, `JobQueuePort` live in `app/shared/` | Used by identity, catalog and audio too, not only AI. LLM/TTS/embedding ports stay in `ai/adapters`. |
| D2 | API sketches use paths like `/series/{id}` for both writers and listeners | Namespaces: `/studio/*` (writers/admins), `/admin/*` (admins), unprefixed listener routes, `/public/*` (website) | Avoids path collisions and makes role checks obvious. |
| D3 | Object storage + CDN | `LocalStorage` with HMAC-signed URLs for now | Hosting not chosen; S3/CDN adapter plugs into the same port. |
| D4 | Async stack not specified | Sync SQLAlchemy 2 + psycopg 3 in the API (FastAPI threadpool) | Simpler code and tests; workers run sync services in threads. |
| D5 | LLM tracing "for example Langfuse" | `TracerPort` with a structured-log tracer | Tracing vendor not chosen; a Langfuse/OpenTelemetry adapter plugs into the same port. |
| D7 | One `thread_id` per episode per workflow, e.g. `episode-123:drafting` | `episode-{id}:{workflow}:{run}`: still one thread per episode and workflow, plus the run | A new drafting run must start from a fresh state; a paused run resumes from its own checkpoint. |
| D6 | Embeddings via `EmbeddingPort` | Deterministic fake embeddings (1536 dimensions) | Anthropic has no embeddings API and the embedding provider is not chosen. |

## [CHECK] items verified
| Item | Result (date) |
| ---- | ------------- |
| LangGraph interrupts + Postgres checkpointer | langgraph 1.2.x: `langgraph.types.interrupt()` inside a node, resume with `Command(resume=...)`, `PostgresSaver.from_conn_string(...).setup()`. Verified with a local run (3 Nov 2026). |
| Anthropic Python SDK | `anthropic==2.4.0`: `client.beta.messages.stream(..., betas=["server-side-fallback-2026-07-01"], fallbacks="default", output_config={"effort": ..., "format": {"type": "json_schema", ...}})` accepted; typed errors `RateLimitError`, `APIStatusError`, `APIConnectionError`, `APITimeoutError`. Checked against the installed SDK (3 Nov 2026). |

## Defaults taken for [OPEN] items (confirm with owner)
See `spec_docs/plans/README.md` and each plan's review table. Additional choices made while implementing:

| Plan | Item | Default |
| ---- | ---- | ------- |
| 01 | Social login providers | Port and endpoint built; disabled until providers are chosen (`BIBI_SOCIAL_AUTH_BACKEND`). A verified social email links to an existing password account with the same email. |
| 01 | Email verification | Not required (spec default). |
| 01 | Invite for an email that already has a listener account | Rejected with `email_in_use`; the admin decides how to proceed. |
| 01 | Refresh token reuse | Treated as theft: all of that user's sessions are revoked. |
| 01 | Self-service account deletion | Listeners only; writer and admin accounts are deactivated by an admin instead. |
| 02 | Archived series | Hidden from shelves and search; still readable by id (`GET /series/{id}`) for listeners who already have it. |
| 02 | Search scope (MVP) | Case-insensitive title match on published series, ordered by play count. |
| 02 | Empty shelves | Not returned to listeners (a shelf with no published series is skipped). |
| 02 | Cover URLs | Signed, valid 24 hours; type checked by file signature (JPEG, PNG, WebP), max 5 MB. |
| 02 | Unarchive | Returns to `published` if the series was ever published, otherwise `draft`. |
| 03 | Narrator | One character per series can be the narrator; marking another unmarks the previous one. |
| 03 | Accepting a proposal | The writer may edit the proposed payload before accepting; it is validated like a normal edit. Proposals for deleted entries become `proposal_stale`. |
| 03 | Bible search | Case-insensitive match on names, titles and descriptions across all sections. |
| 04 | Editor concurrency ([OPEN] lock vs check) | Optimistic check: every save sends `base_version`; a stale save gets `409 version_conflict`. |
| 04 | Saving text after audio, review or approval | Any text change moves the episode back to `drafting` (audio and review must be redone). Editing is blocked while `in_review`. |
| 04 | Duration estimate | 150 words per minute, shown live in the editor and stored per version. |
| 04 | Episode numbering | New episodes are numbered last; deleting a planned episode closes the gap; reordering cannot move published episodes. |
| 14 | LLM provider and model | Claude via the official SDK, `claude-opus-5-5`, effort `high` (set explicitly; the model's default is `medium`), streaming. Selected with `BIBI_LLM_BACKEND=anthropic`; fakes are the default. |
| 14 | Refusals | Server-side `fallbacks: "default"` is on (`BIBI_LLM_FALLBACKS`); a refusal that still ends the call fails the step with code `refused`. |
| 14 | Cached input tokens | Billed at the full input price in our cost rows (slight over-estimate) until cache pricing is modelled. |
| 14 | Budgets | Soft per-series limit set by admins; Studio shows a warning, nothing is blocked. |
| 14 | Run progress stream | Server-sent events; the stream closes when a run waits for the writer or finishes, and resumes from `Last-Event-ID`. |
| 05 | Draftable statuses | `planned`, `drafting` and `changes_requested`; at least one beat is required. |
| 05 | "Edit" at draft review | Saves the writer's text as a new version and counts as approval. |
| 05 | Rewriting a selection | Applies to the saved text only; during a run it goes through the review step, otherwise a one-step `section_regen` run. |
| 05 | Retrieval for drafting | The two previous episodes plus the three most similar earlier summaries (pgvector cosine). |
| 05 | Malformed AI canon suggestions | Dropped and logged; they never fail the run. |
