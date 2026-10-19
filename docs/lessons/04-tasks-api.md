# Lesson 04: Tasks API

## Goal
A REST API where each user can only ever see and change their own tasks, with filtering, search, ordering and pagination.

## Concepts
- **Authorization is not authentication.** A valid token proves who you are. The queryset decides what you may touch.
- **Scope the queryset, return 404.** Filtering by `owner=request.user` means another user's task "does not exist", and attackers cannot probe which IDs are real. A 403 would confirm that the ID exists.
- **No mass assignment.** `owner` is not a serializer field, so a client cannot submit `{"owner": 2}`.
- **Defense in depth.** Database `CHECK` constraints back up serializer validation.
- **Indexes match queries.** Every list query filters by owner first, so each composite index starts with `owner`.

## Files touched
- `backend/tasks/models.py`, `serializers.py`, `views.py`, `urls.py`, `pagination.py`, `admin.py`, `apps.py`
- `backend/tasks/migrations/0001_initial.py`

## Walkthrough
- `backend/tasks/models.py:5-15`: `TaskStatus` and `TaskPriority` choices, defined at module level so `Meta` can reference them.
- `backend/tasks/models.py:37-39`: composite indexes `(owner, status)`, `(owner, due_date)` and `(owner, -created_at)`.
- `backend/tasks/models.py:42-54`: check constraints. The title must be non-empty, and status and priority must be valid values.
- `backend/tasks/serializers.py:20`: `read_only_fields`. `owner` isn't listed in `fields` at all.
- `backend/tasks/views.py:24-28`: `get_queryset` filters by owner, and `perform_create` sets the owner. These four lines are the whole authorization model.
- `backend/tasks/views.py:19-21`: `filterset_fields`, `search_fields` and `ordering_fields`. Explicit allowlists, so clients cannot sort or filter by arbitrary columns.
- `backend/tasks/views.py:31`: the `summary` action returns per-status counts using one `GROUP BY` query.
- `backend/tasks/pagination.py:7`: `max_page_size = 100` stops `?page_size=1000000`.

## Run it
```bash
git checkout lesson-04
cd backend
uv run python manage.py migrate
uv run python manage.py check
uv run python manage.py runserver 127.0.0.1:8000
```
In another terminal:
```bash
curl -s -X POST localhost:8000/api/v1/auth/register/ -H 'Content-Type: application/json' \
  -d '{"username":"student","email":"student@example.com","password":"Lesson-04-pass"}'
curl -s -X POST localhost:8000/api/v1/auth/login/ -H 'Content-Type: application/json' \
  -d '{"username":"student","password":"Lesson-04-pass"}'
```

## Check yourself
- `manage.py check` prints `System check identified no issues (0 silenced).`
- Register returns `{"id":…, "username":"student", "email":"student@example.com"}`, with no password in the response.
- Login returns `{"access": "…", "user": {…}}`. Run curl with `-i` to see the `Set-Cookie: taskflow_refresh=…; HttpOnly; Path=/api/v1/auth/` header.

## Exercise
Create a second user, create a task as user A, then `GET /api/v1/tasks/<id>/` with user B's access token. Confirm it returns 404. Then explain why 404 is the better answer here.
