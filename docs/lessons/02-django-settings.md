# Lesson 02: Django project and settings

## Goal
Create the Django project with settings that come entirely from environment variables and are secure by default.

## Concepts
- **12-factor config.** The same code runs in dev and in production; only the environment differs.
- **Secure defaults.** `DEBUG` defaults to `False`, and cookies default to `Secure`. You opt out locally, never opt in for production.
- **No default secret key.** If `DJANGO_SECRET_KEY` is missing, the app refuses to start instead of running with a guessable key.
- **uv** manages Python and dependencies. `uv.lock` pins exact versions.

## Files touched
- `backend/pyproject.toml`, `backend/uv.lock`, `backend/manage.py`
- `backend/config/settings.py`, `backend/config/urls.py`, `backend/config/wsgi.py`, `backend/config/asgi.py`
- `backend/.env.example`

## Walkthrough
- `backend/config/settings.py:31`: `SECRET_KEY = env("DJANGO_SECRET_KEY")`, with no fallback.
- `backend/config/settings.py:80`: `DATABASES` parsed from a single `DATABASE_URL`.
- `backend/config/settings.py:83`: `AUTH_USER_MODEL = "accounts.User"`. Set this before the first migration; swapping the user model later is painful.
- `backend/config/settings.py:104-127`: DRF defaults are JWT authentication and `IsAuthenticated`, so every endpoint is private unless it explicitly opts out. Also pagination, filter backends and scoped throttles.
- `backend/config/settings.py:134-144`: SimpleJWT. 5-minute access tokens, 7-day refresh tokens, `ROTATE_REFRESH_TOKENS` and `BLACKLIST_AFTER_ROTATION`, and the refresh cookie name and path.
- `backend/config/settings.py:166`: `SECURE_PROXY_SSL_HEADER` is only trusted when `BEHIND_TLS_PROXY` is set. Trusting it blindly lets clients fake HTTPS.
- `backend/pyproject.toml`: pytest and ruff configuration live next to the dependencies.

## Run it
```bash
git checkout lesson-02
cd backend
cp .env.example .env
uv run python -c "from django.core.management.utils import get_random_secret_key as g; print(g())"
# paste the output into DJANGO_SECRET_KEY in .env
uv sync
```

## Check yourself
`uv sync` succeeds. `uv run python manage.py check` **fails at this tag**: settings list the `accounts` and `tasks` apps and `tasks.pagination`, which arrive in lessons 03 and 04. This is expected.

## Exercise
Remove `DJANGO_SECRET_KEY` from `.env`, then read the error that `manage.py` gives you (after lesson 04). Why is a crash better than a default?
