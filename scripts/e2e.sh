#!/usr/bin/env bash
# Run the Playwright end-to-end suite. Playwright starts its own API (:8001) and
# Vite (:5174); this script prepares a separate
# taskflow_e2e database first. Extra args go to `playwright test`.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

if [[ ! -f backend/.env ]]; then
  echo "backend/.env is missing. Run /dev once, or copy backend/.env.example and set DJANGO_SECRET_KEY." >&2
  exit 1
fi

# E2E gets its own database so test users never land in the dev database.
export E2E_DATABASE_URL="${E2E_DATABASE_URL:-postgres://taskflow:${POSTGRES_PASSWORD:-taskflow_dev_password}@127.0.0.1:${POSTGRES_PORT:-5433}/taskflow_e2e}"

docker compose up -d --wait
if ! docker compose exec -T db psql -U taskflow -d taskflow -tAc "SELECT 1 FROM pg_database WHERE datname = 'taskflow_e2e'" | grep -q 1; then
  docker compose exec -T db createdb -U taskflow taskflow_e2e
fi
(cd backend && DATABASE_URL="$E2E_DATABASE_URL" uv run python manage.py migrate --no-input)

cd frontend
if [[ ! -d node_modules ]]; then
  npm install
fi
npx playwright install chromium
npx playwright test "$@"
