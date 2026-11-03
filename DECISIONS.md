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

## [CHECK] items verified
| Item | Result (date) |
| ---- | ------------- |
| LangGraph interrupts + Postgres checkpointer | langgraph 1.2.x: `langgraph.types.interrupt()` inside a node, resume with `Command(resume=...)`, `PostgresSaver.from_conn_string(...).setup()`. Verified with a local run (3 Nov 2026). |

## Defaults taken for [OPEN] items (confirm with owner)
See `spec_docs/plans/README.md` and each plan's review table.
