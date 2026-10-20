---
model: haiku
description: Start Postgres, the Django API and the Vite dev server
---

Start the local development stack from the repository root.

1. If `backend/.env` is missing, copy `backend/.env.example` to it. Generate a `DJANGO_SECRET_KEY` with
   `uv run python -c "from django.core.management.utils import get_random_secret_key as g; print(g())"`.
   Do not print the key.
2. Run `scripts/dev.sh` in the background. It starts the database, runs `uv sync` and `migrate`, installs `frontend/node_modules` if missing, then starts the API on 127.0.0.1:8000 and Vite on :5173. If it exits because the Docker daemon is not running, tell the user to start Docker Desktop and stop.
3. Wait until both http://127.0.0.1:8000/admin/login/ and http://localhost:5173/ respond.

Then print:
- App: http://localhost:5173
- API: http://localhost:5173/api/v1/ (proxied to :8000)
- Django admin: http://127.0.0.1:8000/admin/

If a port is already in use, report which one, and do not kill the existing process without asking.
