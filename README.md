# TaskFlow

Full-stack task management app: a React + TypeScript SPA on top of a Django REST API.

- **Frontend:** React 19, TypeScript 7, Vite 8, Ant Design 6, Tailwind CSS 4 (layout only), Axios, React Router 7, i18next
- **Backend:** Django 6.1, Django REST Framework 3.18, SimpleJWT 5.5, django-filter
- **Database:** PostgreSQL 17 (Docker for local development)
- **Features:** register/login, per-user task CRUD, search/filter/sort/pagination, task summary, Khmer and English, light and dark themes, responsive layout

## Project layout

```
taskflow-fullstack/
├── docker-compose.yml        # Local PostgreSQL only
├── backend/
│   ├── config/               # settings (env-driven), root urls
│   ├── accounts/             # custom User, register/login/refresh/logout/me
│   └── tasks/                # Task model, serializer, viewset, pagination
└── frontend/src/
    ├── api/                  # axios client (token refresh), typed services, error parsing
    ├── features/auth/        # AuthProvider, route guards, login/register pages
    ├── features/tasks/       # tasks page, list, filters, form modal
    ├── components/           # layout, error/empty/loading states
    ├── i18n/                 # en.ts, km.ts (type-checked for completeness)
    └── preferences/          # theme + language, Ant Design ConfigProvider
```

## Setup

Prerequisites: Docker, [uv](https://docs.astral.sh/uv/), and Node 20.19+ (or 22.12+).

```bash
# 1. Database (host port 5433 so it doesn't clash with a local Postgres)
docker compose up -d --wait

# 2. Backend
cd backend
cp .env.example .env
# Set DJANGO_SECRET_KEY in .env:
uv run python -c "from django.core.management.utils import get_random_secret_key as g; print(g())"
uv sync
uv run python manage.py migrate
uv run python manage.py runserver 127.0.0.1:8000

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev        # http://localhost:5173 (proxies /api to :8000)
```

Then open http://localhost:5173 and create an account.

## Environment variables

**backend/.env** (see `backend/.env.example`)

| Variable | Default | Purpose |
|---|---|---|
| `DJANGO_SECRET_KEY` | *(required)* | Signing key for sessions/JWTs. No default on purpose. |
| `DEBUG` | `False` | Only enable locally. |
| `ALLOWED_HOSTS` | empty | Comma-separated hostnames. |
| `DATABASE_URL` | *(required)* | `postgres://user:pass@host:port/db` |
| `SECURE_COOKIES` | `True` | Secure flag on refresh/CSRF/session cookies. Set `False` only for local HTTP. |
| `CSRF_TRUSTED_ORIGINS` | empty | Origins allowed to send unsafe requests, e.g. `https://taskflow.example.com`. |
| `CORS_ALLOWED_ORIGINS` | empty | Only needed if SPA and API are on different origins. |
| `SECURE_SSL_REDIRECT` | `False` | Redirect HTTP to HTTPS in production. |
| `SECURE_HSTS_SECONDS` | `0` | Enable HSTS in production once HTTPS is verified. |
| `BEHIND_TLS_PROXY` | `False` | Trust `X-Forwarded-Proto` from your reverse proxy. |
| `ACCESS_TOKEN_MINUTES` | `5` | Access token lifetime. |
| `REFRESH_TOKEN_DAYS` | `7` | Refresh token lifetime. |
| `AUTH_THROTTLE_RATE` | `10/min` | Login/register rate limit per IP. |
| `REFRESH_THROTTLE_RATE` | `30/min` | Token refresh rate limit per IP. |

**frontend/.env** (optional, see `frontend/.env.example`): `VITE_API_BASE_URL`, `VITE_DEV_API_TARGET`.

## API

All endpoints are under `/api/v1/`. Everything except register/login/refresh/logout needs `Authorization: Bearer <access>`.

| Method | Path | Notes |
|---|---|---|
| POST | `auth/register/` | `{username, email, password}` → 201 user |
| POST | `auth/login/` | `{username, password}` → `{access, user}` and sets the refresh cookie |
| POST | `auth/refresh/` | Cookie + `X-CSRFToken` → `{access}`; rotates the refresh cookie |
| POST | `auth/logout/` | Cookie + `X-CSRFToken` → 204; blacklists the refresh token |
| GET | `auth/me/` | Current user |
| GET/POST | `tasks/` | List (paginated) / create. Query: `page`, `page_size` (≤100), `search`, `status`, `priority`, `ordering` |
| GET/PUT/PATCH/DELETE | `tasks/{id}/` | Own tasks only; anything else returns 404 |
| GET | `tasks/summary/` | `{todo, in_progress, done, total}` |

Errors use DRF's standard shape: `{"detail": "..."}` or `{"field": ["..."]}`.

## Security design

- **Tokens.** The access token (5 min) lives only in JS memory. The refresh token (7 days) is an `httpOnly`, `SameSite=Lax` cookie scoped to `/api/v1/auth/`, so XSS cannot read it. Refresh tokens rotate on every use, and the old one is blacklisted, so a replayed token is rejected.
- **CSRF.** Refresh and logout rely on a cookie, so they enforce Django's CSRF check. Other endpoints use Bearer headers and are not CSRF-exposed.
- **Same origin.** The SPA and API share one origin: a Vite proxy in development, a reverse proxy in production. CORS stays closed by default.
- **Authorization.** The task queryset is always filtered by `owner=request.user`. `owner` is never writable from the client.
- **Brute force.** Login and register are throttled per IP.
- **Config.** All secrets come from the environment, and `DEBUG` defaults to off.

## Checks

```bash
# backend
cd backend
uv run pytest
uv run ruff check . && uv run ruff format --check .
uv run python manage.py check
uv run python manage.py makemigrations --check --dry-run

# frontend
cd frontend
npm run typecheck && npm run lint && npm test && npm run build
```

## Production notes

- Serve `frontend/dist` and proxy `/api` to Django (gunicorn) on the same domain behind HTTPS.
- Set `DEBUG=False`, `SECURE_COOKIES=True`, `SECURE_SSL_REDIRECT=True`, `SECURE_HSTS_SECONDS`, `ALLOWED_HOSTS` and `CSRF_TRUSTED_ORIGINS`.
- Run `uv run python manage.py check --deploy`.
- Use a shared cache (for example Redis) for throttling when running more than one process. The default cache is per-process.
- Schedule `uv run python manage.py flushexpiredtokens` to prune the token blacklist.
