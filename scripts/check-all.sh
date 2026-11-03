#!/usr/bin/env bash
# Runs the same checks as CI. Needs Postgres+pgvector (TEST_DATABASE_URL) and pnpm.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"

echo "== backend"
cd "$root/backend"
ruff check .
ruff format --check .
mypy
lint-imports
pytest
BIBI_DATABASE_URL="${TEST_DATABASE_URL:-postgresql+psycopg://postgres:postgres@localhost:5432/bibi_test}" \
  alembic check

echo "== frontend"
cd "$root"
pnpm api-client:check
pnpm -r --if-present typecheck
pnpm -r --if-present lint
pnpm -r --if-present test
pnpm --filter @bibi/studio check-bundle >/dev/null
NEXT_TELEMETRY_DISABLED=1 pnpm --filter @bibi/web build >/dev/null
echo "All checks passed."
