# Bibi backend

FastAPI modular monolith (see `spec_docs/15-platform-and-nfr.md`).

## Layout

- `app/main.py`: application factory
- `app/container.py`: dependency injection; every adapter is wired here
- `app/worker.py`: Arq workers (`DefaultWorker`, `DraftingWorker`, `VoiceWorker`)
- `app/shared/`: config, db, errors, pagination, audit log, logging, rate limits, storage, email, jobs
- `app/modules/<name>/`: one folder per module with `api/`, `service.py`, `repository.py`, `models.py`, `schemas.py`, `ports.py`. Other modules import only from the package itself (enforced by import-linter).
- `migrations/`: Alembic migrations, one per plan

## Run locally without Docker

```bash
python -m venv .venv && . .venv/bin/activate
pip install -e ".[dev]"
export BIBI_DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/bibi
alembic upgrade head
uvicorn app.main:app --reload
# workers (needs BIBI_REDIS_URL and BIBI_QUEUE_BACKEND=arq)
arq app.worker.DefaultWorker
```

## Checks

```bash
export TEST_DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/bibi_test  # gets reset
ruff check . && ruff format --check .
mypy
lint-imports
pytest
```

The test database needs the `vector` extension available (Postgres 16 + pgvector).
