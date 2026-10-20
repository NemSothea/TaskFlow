#!/usr/bin/env bash
# Start Postgres, the Django API (:8000) and the Vite dev server (:5173). Ctrl-C stops both.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

if [[ ! -f backend/.env ]]; then
  echo "backend/.env is missing. Copy backend/.env.example to backend/.env and set DJANGO_SECRET_KEY:" >&2
  echo '  uv run python -c "from django.core.management.utils import get_random_secret_key as g; print(g())"' >&2
  exit 1
fi

docker compose up -d --wait

(cd backend && uv sync && uv run python manage.py migrate)
if [[ ! -d frontend/node_modules ]]; then
  (cd frontend && npm install)
fi

pids=()
trap 'kill ${pids[@]+"${pids[@]}"} 2>/dev/null || true' EXIT INT TERM

(cd backend && exec uv run python manage.py runserver 127.0.0.1:8000) &
pids+=($!)
(cd frontend && exec npm run dev) &
pids+=($!)

echo "App:          http://localhost:5173"
echo "API:          http://localhost:5173/api/v1/ (proxied to :8000)"
echo "Django admin: http://127.0.0.1:8000/admin/"

# bash 3.2 (macOS default) has no `wait -n`; Ctrl-C triggers the trap.
wait
