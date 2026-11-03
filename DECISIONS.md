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
