# TaskFlow backend

Python 3.13 (uv), Django 6.1, DRF 3.18, SimpleJWT 5.5, django-filter, PostgreSQL 17.
Root rules in `../CLAUDE.md` (Auth model, Never) apply here too.

## Folder map
```
config/        settings (all values from env), root urls
accounts/      custom User, register/login/refresh/logout/me, refresh-cookie helpers
tasks/         Task model, serializer, owner-scoped viewset, pagination
*/tests/       pytest-django tests per app
```

## Commands (run from backend/)
```bash
uv run python manage.py runserver 127.0.0.1:8000
uv run pytest
uv run ruff check . && uv run ruff format --check .
uv run python manage.py check
uv run python manage.py makemigrations --check --dry-run
```
All at once: `../scripts/check-backend.sh`. Tests need the database (`docker compose up -d --wait` from the root).

## Conventions
- Task querysets are always `Task.objects.filter(owner=request.user)`. Another user's object returns 404, not 403.
- `owner` is never client-writable. Set it in `perform_create`.
- Serializer changes must be mirrored in `frontend/src/api/types.ts`.
- New backend rules need a pytest. Follow the `backend-tests` skill.
- Never edit an applied migration. Create a new one, and read it before applying.
