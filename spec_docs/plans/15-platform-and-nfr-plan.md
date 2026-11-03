# Plan 15: Platform Foundation

Spec: [15-platform-and-nfr.md](../15-platform-and-nfr.md) · Order: 1 · Depends on: nothing

## Goal
A working monorepo with the backend skeleton, shared infrastructure, Studio app shell, generated API client, Docker setup and CI, so every later plan only adds features.

## Design

```
backend/
  pyproject.toml  alembic.ini  .importlinter  Dockerfile
  app/
    main.py            # create_app(): middleware, error handlers, routers
    container.py       # Container: settings + adapters; get_container dependency
    worker.py          # Arq WorkerSettings (drafting and voice queues)
    cli.py             # management commands
    export_openapi.py  # writes openapi.json for the TS client
    shared/
      config.py        # Settings (pydantic-settings, env vars only)
      db.py            # engine, SessionLocal, Base, UUID + timestamp mixin, get_db
      errors.py        # AppError(code, message, status, details) + handlers
      pagination.py    # PageParams dependency, Page[T] schema
      audit.py         # AuditLog model + record_audit()
      logging.py       # JSON structured logs, request-id contextvar
      middleware.py    # RequestIdMiddleware
      ratelimit.py     # fixed-window limiter (Redis, in-memory fallback) dependency
      events.py        # tiny in-process event hooks (e.g. user_deleted)
      jobs.py          # JobQueuePort, ArqJobQueue, InMemoryJobQueue
      storage.py       # StoragePort, LocalStorage (signed URLs), InMemoryStorage
      email.py         # EmailPort, ConsoleEmail, SmtpEmail, FakeEmail
    modules/           # identity, catalog, writing, ai, audio, listening, analytics, admin
  migrations/
  tests/
apps/studio/           # React + Vite + TS + Tailwind + shadcn-style UI, TanStack Query, Zustand, React Router
packages/api-client/   # openapi.json → schema.d.ts (openapi-typescript) + client.ts (openapi-fetch)
docker-compose.yml     # pgvector/pgvector:pg16, redis, api, worker
.github/workflows/ci.yml
DECISIONS.md
```

- Storage and email ports live in `shared/` because several modules use them (spec 7.1 lists them under `ai/adapters`; recorded in `DECISIONS.md`). LLM, TTS and embedding ports stay in `ai/adapters` (plan 14).
- Studio shell: `/login`, `/writer/*`, lazily loaded `/admin/*`, `RequireRole` guard, shared `AppLayout`, minimal shadcn-style components (`Button`, `Input`, `Card`, `Table`, `Badge`, `Label`, `Textarea`).

## Tasks (one commit each)
1. Monorepo skeleton: root `package.json`, `pnpm-workspace.yaml`, `.gitignore`, `.editorconfig`, `DECISIONS.md`, root README section on layout.
2. Backend package: `pyproject.toml` (pinned deps, ruff, mypy, pytest config), `app/main.py`, `shared/config.py`, `GET /api/v1/health`.
3. Errors and pagination: `AppError`, handlers for `AppError`, validation errors and unhandled errors with the common shape; `PageParams`, `Page[T]`.
4. Logging and request IDs: JSON logs, `X-Request-ID` in/out, request id in every log line and error response.
5. Database: `shared/db.py`, Alembic setup, first migration (enable `vector` extension, `audit_log` table), `record_audit()`.
6. Container and shared adapters: `container.py`, `StoragePort`/`LocalStorage`/`InMemoryStorage` with HMAC-signed URLs and `/media` route, `EmailPort` adapters, `JobQueuePort` with Arq and in-memory implementations, `worker.py`.
7. Rate limiter dependency (Redis when configured, in-memory otherwise) and `shared/events.py`.
8. Test harness: `conftest.py` (migrated test DB, truncation, app with fake container, client), tests for health, error shape, pagination, request id, rate limit, signed URLs, audit record, job queue.
9. Static checks: ruff config, mypy config, `.importlinter` (module boundary contracts, LangGraph only in `ai`, vendor SDKs only in adapters).
10. Docker: backend `Dockerfile`, `docker-compose.yml` (db, redis, api, worker), `.env.example`.
11. API client package: `export_openapi.py`, `packages/api-client` with generate and check scripts.
12. Studio shell: Vite app, Tailwind, UI components, router with guards and lazy admin chunk, auth store stub, Vitest tests for guards.
13. CI: GitHub Actions with backend job (Postgres+pgvector and Redis services; ruff, mypy, lint-imports, alembic upgrade, pytest) and frontend job (pnpm install, api-client check, Studio typecheck, lint and tests).

## Tests
- Backend: `tests/shared/*` covering every shared component above.
- Studio: guard redirects (no user → `/login`; writer → `/admin` denied; admin allowed both).
- Build check: Studio production build emits a separate admin chunk.

## Spec coverage review

| Spec requirement | Covered by | Status |
| ---------------- | ---------- | ------ |
| FastAPI modular monolith, module layout with api/service/repository/models/schemas/ports | Tasks 2, 9; module folders created empty, filled by later plans | ✅ |
| import-linter: modules talk only via public interfaces | Task 9 | ✅ |
| Adapters/ports for LLM, TTS, storage, embedding, email; wired in `container.py` | Task 6 (storage, email, jobs); LLM/TTS/embedding in plan 14 | ✅ (split) |
| Postgres + pgvector | Task 5 | ✅ |
| Object storage + CDN | Task 6 `LocalStorage` with signed URLs; S3/CDN adapter deferred until hosting is chosen | ⚠️ deferred, noted in DECISIONS |
| Background workers, queue, separate drafting/voice queues | Task 6 | ✅ |
| Realtime progress SSE/WebSocket | Plan 14 (workflow run events stream) | ➡️ plan 14 |
| Monorepo with shared packages, generated client and types | Tasks 1, 11 | ✅ |
| Shared query hooks and validation schemas packages | Hooks live in each app at first; extracted to `packages/` once two apps share them (plan 10) | ⚠️ deferred to plan 10 |
| Docker for local dev and deploy | Task 10 | ✅ |
| REST JSON `/api/v1`, OpenAPI source of truth | Tasks 2, 11 | ✅ |
| Role dependency on every route | Plan 01 (identity owns users) | ➡️ plan 01 |
| Pagination on list endpoints | Task 3 | ✅ |
| Long-running work returns `workflow_run` id | Plan 14 | ➡️ plan 14 |
| Consistent error shape with code | Task 3 | ✅ |
| Secrets via env | Task 2 (`Settings` from env, `.env.example` without secrets) | ✅ |
| Signed URLs for audio | Task 6 | ✅ |
| Rate limits on auth, AI, events endpoints | Task 7 provides limiter; applied in plans 01, 05, 12 | ✅ |
| Structured logging with request IDs; error monitoring | Task 4; Sentry wiring in plan 14 | ✅ (split) |
| Data protection, account deletion | Plan 01 + `user_deleted` hook (task 7) | ➡️ plan 01 |
| UUID PKs, `created_at`/`updated_at` | Task 5 mixin | ✅ |
| Audit log for writer/admin writes | Task 5 | ✅ |
| Unit, integration, graph tests with fakes; CI runs lint, types, import-linter, tests | Tasks 8, 9, 13 | ✅ |
| Foundation deliverables incl. `DECISIONS.md` | Tasks 1–13 | ✅ |

Review result: no blocking gaps. Two items deferred with an owner plan (CDN adapter, shared hooks package).
