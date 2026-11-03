# Bibi

**Bibi is an app for audio stories and dramas.** It uses AI to generate stories and offers a friendly, easy-to-use interface for listening to them.

## Features

- **AI-generated stories** – new stories and dramas created by AI, on any theme or genre
- **Audio storytelling** – stories are narrated so you can listen anywhere, hands-free
- **Audio dramas** – multi-voice, scene-by-scene performances
- **User-friendly player** – simple playback controls, easy browsing and discovery
- **Personal library** – save favourites and pick up where you left off

> Bibi is under active development. The features above describe the project's vision and will land incrementally.

## Repository layout

| Path | What it is |
| ---- | ---------- |
| `backend/` | FastAPI modular monolith, Arq workers, Alembic migrations |
| `apps/studio/` | Studio web app for writers (`/writer/*`) and admins (`/admin/*`) |
| `packages/api-client/` | TypeScript client generated from the backend's OpenAPI schema |
| `spec_docs/` | Feature specs and implementation plans |
| `DECISIONS.md` | Deviations from the spec and defaults taken for open items |

## Getting started

Requirements: Docker, or Python 3.12+, Node 22, pnpm 10, Postgres 16 with pgvector and Redis.

```bash
git clone https://github.com/saifqamar/bibi.git
cd bibi
cp backend/.env.example backend/.env
docker compose up        # api on :8000, studio via `pnpm studio:dev`
```

Running the backend tests locally is described in `backend/README.md`.

## Contributing

Ideas and contributions are welcome. Open an issue to discuss what you'd like to change.
