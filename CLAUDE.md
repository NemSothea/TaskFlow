# TaskFlow

Full-stack task manager. Django REST API + React SPA, served from one origin.

## Stack
- Backend (`backend/`): Python 3.13 (uv), Django 6.1, DRF 3.18, SimpleJWT 5.5, django-filter, PostgreSQL 17
- Frontend (`frontend/`): React 19, TypeScript 7, Vite 8, Ant Design 6, Tailwind CSS 4, Axios, React Router 7, i18next
- Dev database: `docker-compose.yml` → Postgres on host port **5433**

## Folder map
```
backend/config/        settings (all values from env), root urls
backend/accounts/      custom User, register/login/refresh/logout/me, refresh-cookie helpers
backend/tasks/         Task model, serializer, owner-scoped viewset, pagination
frontend/src/api/      axios client (token refresh), typed services, DRF error parsing
frontend/src/features/ auth/ and tasks/ feature folders (pages + components + hooks)
frontend/src/i18n/     en.ts (source of truth) and km.ts (typed against en)
frontend/src/preferences/  theme + language, Ant Design ConfigProvider
docs/lessons/          step-by-step lesson series, one per git tag lesson-NN
```

## Commands
```bash
docker compose up -d --wait                       # database
cd backend && uv run python manage.py runserver 127.0.0.1:8000
cd frontend && npm run dev                        # http://localhost:5173, proxies /api

# backend checks (run from backend/)
uv run pytest
uv run ruff check . && uv run ruff format --check .
uv run python manage.py check
uv run python manage.py makemigrations --check --dry-run

# frontend checks (run from frontend/)
npm run typecheck && npm run lint && npm test && npm run build
```
Use `/check` to run everything and `/dev` to start the stack.

## Conventions
- Ant Design owns component styling and colors (theme tokens). Tailwind is for layout and spacing only. Tailwind preflight is disabled on purpose.
- Every UI string goes in **both** `frontend/src/i18n/locales/en.ts` and `km.ts`. `km.ts` is typed against `en.ts`, so a missing key fails `tsc`.
- Task querysets are always `Task.objects.filter(owner=request.user)`. Another user's object returns 404, not 403.
- `owner` is never client-writable. Set it in `perform_create`.
- API types in `frontend/src/api/types.ts` mirror the DRF serializers. Update both together.
- Every HTTP call goes through `frontend/src/api/client.ts`. Never create another axios instance.
- New backend rules need a pytest. New frontend logic needs a vitest.
- Commits use Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`, `chore:`, `build:`).

## Auth model (do not change without discussion)
- The access token (5 min) lives in JS memory only.
- The refresh token is an httpOnly cookie on `/api/v1/auth/`. It rotates on every refresh, and the old token is blacklisted.
- Refresh and logout enforce Django CSRF. The SPA sends `X-CSRFToken` from the `csrftoken` cookie.
- Concurrent refreshes share one request (`refreshAccessToken`). Otherwise, rotation would log the user out.

## Never
- Commit `.env` files or real secrets. Only `.env.example` with placeholders.
- Store tokens in `localStorage` or `sessionStorage`.
- Disable CSRF, permissions, throttling, or the ownership filter to "make something work".
- Edit an applied migration. Create a new one.
- Reset or drop the database without explicit approval.
