# 15. Platform, API and Non-functional Requirements

**Scope:** MVP, all components

## Architecture requirements
- Python FastAPI **modular monolith**; modules per master spec section 6, each with `api/`, `service.py`, `repository.py`, `models.py`, `schemas.py`, `ports.py`.
- **import-linter** rules: modules talk only through public service interfaces.
- **Adapters/ports** for LLM, TTS, storage, embedding, email (billing later); implementations chosen from config in `container.py`.
- Postgres with pgvector; object storage plus CDN for audio and images.
- Background workers on a queue (Arq, Celery or Taskiq **[OPEN]**) with separate queues for drafting and voice.
- Realtime progress via SSE or WebSocket.
- Monorepo (pnpm workspaces) with shared packages: generated API client and types, query hooks, validation schemas.
- Docker for local development and deployment.

## API conventions
- REST + JSON under `/api/v1`; OpenAPI is the source of truth and TypeScript clients are generated from it.
- Role dependency on every route; writers scoped to own series.
- Pagination on all list endpoints.
- Long-running work returns a `workflow_run` id, with progress streamed and final state retrievable by id.
- Consistent error shape with machine-readable code.

## Non-functional requirements
- Secrets via environment or secrets manager; never in code.
- Signed URLs or CDN access rules for paid audio (when billing exists).
- Rate limits on auth, AI and listening-event endpoints.
- Structured logging with request ids; error monitoring on all apps.
- Data protection: collect only needed listener data; account deletion.
- UUID primary keys; `created_at` and `updated_at` on all tables.
- Audit log for all writer/admin write actions.

## Testing and CI
- Unit tests for services; integration tests for APIs; graph tests using fake LLM and TTS adapters.
- CI runs lint, type checks, import-linter and tests on every change.

## Deliverables for foundation milestone
Monorepo, Docker setup, Postgres + pgvector, `container.py`, auth with roles, admin-only invites, audit log, CI, `DECISIONS.md` for deviations from the master spec.
