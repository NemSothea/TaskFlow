#!/usr/bin/env bash
# Start Postgres, the Django API (:8000) and the Vite dev server (:5173). Ctrl-C stops both.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

(cd backend && uv sync)

# First run: create backend/.env from the example with a freshly generated secret key.
if [[ ! -f backend/.env ]]; then
  # URL-safe characters only: no "#" or "$" for the .env parser to misread.
  (cd backend && uv run python -c '
import secrets
src = open(".env.example").read()
open(".env", "w").write(src.replace("DJANGO_SECRET_KEY=change-me", "DJANGO_SECRET_KEY=" + secrets.token_urlsafe(50), 1))
')
  echo "Created backend/.env with a generated DJANGO_SECRET_KEY."
fi

docker compose up -d --wait

(cd backend && uv run python manage.py migrate && uv run python manage.py seed_demo)
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
echo "Demo login:   demo / taskflow-demo-123"
echo "Django admin: http://127.0.0.1:8000/admin/ (create an account: see README)"

# bash 3.2 (macOS default) has no `wait -n`; Ctrl-C triggers the trap.
wait
