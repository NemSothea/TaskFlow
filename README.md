# TaskFlow

Full-stack task management app: a React + TypeScript SPA on top of a Django REST API.

- **Frontend:** React 19, TypeScript 7, Vite 8, Ant Design 6, Tailwind CSS 4 (layout only), Axios, React Router 7, i18next
- **Backend:** Django 6.1, Django REST Framework 3.18, SimpleJWT 5.5, django-filter
- **Database:** PostgreSQL 17 (Docker for local development)
- **Features:** register/login, per-user task CRUD, search/filter/sort/pagination, task summary and dashboard charts, Khmer and English, light and dark themes, responsive layout

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

Data model: see [docs/erd.md](docs/erd.md) for the ERD and how the schema is meant to grow.

## Setup

Prerequisites: Docker (running), [uv](https://docs.astral.sh/uv/), and Node 20.19+ (or 22.12+).

```bash
scripts/dev.sh
```

That one command:
1. installs backend dependencies,
2. creates `backend/.env` with a generated `DJANGO_SECRET_KEY` on first run,
3. starts Postgres in Docker on host port **5433**,
4. applies migrations and creates the demo user,
5. installs frontend dependencies on first run,
6. starts the API on :8000 and the app on :5173. Ctrl-C stops both.

Then open http://localhost:5173 and sign in:

| Account | Username | Password | Where |
|---|---|---|---|
| Demo user, 12 sample tasks | `demo` | `taskflow-demo-123` | the app |
| Admin | create it (below) | your choice | http://127.0.0.1:8000/admin/ |

Create an admin account (works from any terminal, including Claude Code's `!` prefix):

```bash
cd backend
DJANGO_SUPERUSER_PASSWORD='pick-a-password' uv run python manage.py createsuperuser --noinput --username admin --email admin@example.com
```

Notes:
- `seed_demo` runs on every `dev.sh` start. It resets the demo password and adds sample tasks only when the demo user has none (`--reset` replaces them). It refuses to run unless `DEBUG=True`, because its password is public.
- The backend refuses to start with the placeholder or any secret key shorter than 32 characters.
- If port 5433 is taken, set `POSTGRES_PORT` before `docker compose up` and change `DATABASE_URL` in `backend/.env` to match.

<details>
<summary>Manual setup (without dev.sh)</summary>

```bash
docker compose up -d --wait
cd backend
cp .env.example .env    # then replace DJANGO_SECRET_KEY with a generated value
uv sync
uv run python manage.py migrate
uv run python manage.py seed_demo
uv run python manage.py runserver 127.0.0.1:8000

# new terminal
cd frontend
npm install
npm run dev
```
</details>

## Environment variables

**backend/.env** (see `backend/.env.example`)

| Variable | Default | Purpose |
|---|---|---|
| `DJANGO_SECRET_KEY` | *(required)* | Signing key for sessions/JWTs. At least 32 characters; the `change-me` placeholder is rejected. `dev.sh` generates one. |
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
| GET | `tasks/stats/` | Dashboard charts: status counts per priority, tasks created per week (last 8), `overdue`, `due_this_week` |

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
scripts/check.sh   # backend: pytest, ruff, Django checks, migration check; frontend: typecheck, lint, vitest, build
scripts/e2e.sh     # Playwright journeys in a real browser against a real API
```

- E2E uses its own `taskflow_e2e` database, so it never adds users to your dev data.
- CI (`.github/workflows/ci.yml`) runs the backend checks, frontend checks and E2E on every push to `main` and every pull request.

## Known limitations

Be clear about what this project is: a well-tested single-user task manager for learning and local use. It is not production-ready yet.

- **No deployment setup.** There is no Dockerfile, no `gunicorn` dependency and no reverse-proxy config. The production checklist below is guidance, not something you can run as is.
- **Accounts:** no password reset, password change, email verification or account deletion in the app. Admins can do these in Django admin.
- **Tasks:** each task belongs to one user. No sharing, projects, tags, comments, attachments or task detail page. See [docs/erd.md](docs/erd.md) for how the schema would grow.
- **Throttling** uses the per-process default cache. It is only accurate with one server process.
- **No monitoring:** no error tracking, metrics or structured logs.

## Before deploying (checklist)

- Add a WSGI server (for example `gunicorn`), serve `frontend/dist` and proxy `/api` to Django on the same domain behind HTTPS.
- Set `DEBUG=False`, `SECURE_COOKIES=True`, `SECURE_SSL_REDIRECT=True`, `SECURE_HSTS_SECONDS`, `ALLOWED_HOSTS` and `CSRF_TRUSTED_ORIGINS`.
- Run `uv run python manage.py check --deploy` and fix every warning.
- Use a shared cache (for example Redis) for throttling when running more than one process.
- Schedule `uv run python manage.py flushexpiredtokens` to prune the token blacklist.
