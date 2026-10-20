#!/usr/bin/env bash
# Run the Playwright end-to-end suite. Playwright starts its own API (:8001) and
# Vite (:5174); this script prepares the database first. Extra args go to `playwright test`.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

if [[ ! -f backend/.env ]]; then
  echo "backend/.env is missing. Run /dev once, or copy backend/.env.example and set DJANGO_SECRET_KEY." >&2
  exit 1
fi

docker compose up -d --wait
(cd backend && uv run python manage.py migrate --no-input)

cd frontend
if [[ ! -d node_modules ]]; then
  npm install
fi
npx playwright install chromium
npx playwright test "$@"
