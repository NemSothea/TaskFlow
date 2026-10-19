---
description: Start Postgres, the Django API and the Vite dev server
---

Start the local development stack from the repository root.

1. `docker compose up -d --wait`. If the Docker daemon is not running, tell the user to start Docker Desktop and stop.
2. If `backend/.env` is missing, copy `backend/.env.example` to it. Generate a `DJANGO_SECRET_KEY` with
   `uv run python -c "from django.core.management.utils import get_random_secret_key as g; print(g())"`.
   Do not print the key.
3. In `backend/`, run `uv sync`, then `uv run python manage.py migrate`.
4. Start `uv run python manage.py runserver 127.0.0.1:8000` in the background.
5. In `frontend/`, run `npm install` only if `node_modules/` is missing. Then start `npm run dev` in the background.
6. Wait until both http://127.0.0.1:8000/admin/login/ and http://localhost:5173/ respond.

Then print:
- App: http://localhost:5173
- API: http://localhost:5173/api/v1/ (proxied to :8000)
- Django admin: http://127.0.0.1:8000/admin/

If a port is already in use, report which one, and do not kill the existing process without asking.
