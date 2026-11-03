# Implementation Plans

One plan per feature spec in `spec_docs/`. Each plan lists the design, the tasks (one small commit each), the tests that prove it works, and ends with a **Spec coverage review** that maps every requirement and acceptance criterion of the spec to plan tasks. Gaps found during review are fixed in the plan before coding starts, or recorded as deferred with the plan that picks them up.

## Owner decisions taken for these plans (3 Nov 2026)

| Topic | Decision |
| ----- | -------- |
| Scope | Backend + Studio first, then mobile app and website. Spec 16 is plan-only. |
| Queue | Arq (Redis). |
| AI providers | Ports with fake adapters for tests; one thin real LLM adapter (Anthropic). TTS provider stays configurable; a fake/sine TTS is used until chosen. |
| Git flow | Small commits per task on `dev`; one PR `dev → main` per plan; squash merge; `dev` is then reset to the new `main`. |
| Review | Written "Spec coverage review" section at the end of each plan. |

## Shared conventions (apply to every plan)

- **API namespaces** (refines the spec sketches, see `DECISIONS.md`):
  - `/api/v1/auth/*`, `/api/v1/me/*`: any signed-in user
  - `/api/v1/series`, `/api/v1/shelves`, `/api/v1/episodes/*`, `/api/v1/events`: listener-facing catalog and playback
  - `/api/v1/studio/*`: writers (own series only) and admins (all series)
  - `/api/v1/admin/*`: admins only
  - `/api/v1/public/*`: no auth (website)
- **Backend:** FastAPI, sync SQLAlchemy 2 + psycopg 3, Alembic (one migration per plan), Postgres 16 + pgvector, Arq workers, LangGraph only inside `app.modules.ai`.
- **Module boundaries:** other modules import only a module's package (`app.modules.<name>`), which re-exports its public service and schemas. Enforced by import-linter.
- **Vendor SDKs** only inside adapters; adapters wired in `app/container.py`; tests swap in fakes.
- **Errors:** `{"error": {"code": "...", "message": "...", "details": {...}}}`.
- **Lists:** `?limit=&offset=` → `{"items": [...], "total": n, "limit": l, "offset": o}`.
- **Tests:** pytest against a real Postgres test database (`TEST_DATABASE_URL`); tables truncated between tests; jobs run through an in-memory queue that tests drain explicitly. Frontend tests use Vitest (Studio, web) and Jest (mobile).
- **Definition of done per plan:** ruff, mypy, import-linter, pytest and the frontend checks all pass locally; PR merged.

## Plans and implementation order

| Order | Plan | Spec |
| ----- | ---- | ---- |
| 1 | [15 Platform foundation](15-platform-and-nfr-plan.md) | 15 |
| 2 | [01 Identity, auth and roles](01-identity-auth-roles-plan.md) | 01 |
| 3 | [02 Catalog and publishing](02-catalog-and-publishing-plan.md) | 02 |
| 4 | [03 Series setup and story bible](03-series-setup-and-story-bible-plan.md) | 03 |
| 5 | [04 Episode planning, editor and versions](04-episode-planning-and-editor-plan.md) | 04 |
| 6 | [14 AI cost tracking and observability](14-ai-cost-and-observability-plan.md) | 14 |
| 7 | [05 AI drafting workflow](05-ai-drafting-workflow-plan.md) | 05 |
| 8 | [06 Continuity check](06-continuity-check-plan.md) | 06 |
| 9 | [07 Voice and audio production](07-voice-and-audio-production-plan.md) | 07 |
| 10 | [08 Review and approval](08-review-and-approval-plan.md) | 08 |
| 11 | [09 Studio admin area](09-studio-admin-area-plan.md) | 09 |
| 12 | [12 Listening events and analytics](12-listening-events-and-analytics-plan.md) | 12 |
| 13 | [10 Mobile browse and series](10-mobile-browse-and-series-plan.md) | 10 |
| 14 | [11 Mobile player and offline](11-mobile-player-and-offline-plan.md) | 11 |
| 15 | [13 Public website](13-public-website-plan.md) | 13 |
| – | [16 Later features](16-later-features-plan.md) | 16 (no code) |

Plan 14 moves ahead of 05 because the drafting graph needs the AI ports, usage recording and workflow-run tables first. Plan 12 moves ahead of the mobile plans because the app sends events and progress to its endpoints.
