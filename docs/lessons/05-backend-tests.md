# Lesson 05: Backend tests

## Goal
Prove the security and business rules with automated tests against a real PostgreSQL database.

## Concepts
- **Test the rules, not the framework.** These tests cover ownership isolation, token rotation, CSRF, validation and throttling. Nothing checks that Django can save a row.
- **Fixtures** (`conftest.py`) build users and authenticated clients, so each test reads like a sentence.
- **Parametrize** turns one test into four HTTP methods.
- **Query-count assertions** catch N+1 regressions before they reach production.
- **Independent tests.** Throttle counters live in the cache, so it is cleared before each test.

## Files touched
- `backend/conftest.py`
- `backend/accounts/tests/test_auth.py`
- `backend/tasks/tests/test_tasks_api.py`, `backend/tasks/tests/test_models.py`

## Walkthrough
- `backend/conftest.py:7`: an autouse fixture clears the throttle cache.
- `backend/conftest.py:27`: `auth_client` returns a client carrying a real access token.
- `backend/accounts/tests/test_auth.py:57`: login must set an `httponly` cookie and must **not** return the refresh token in the JSON body.
- `backend/accounts/tests/test_auth.py:87`: rotation. A replayed old refresh token gets a 401.
- `backend/accounts/tests/test_auth.py:80`: refresh without a CSRF token gets a 403. The client uses `enforce_csrf_checks=True`.
- `backend/tasks/tests/test_tasks_api.py:35`: a client-supplied `owner` is ignored.
- `backend/tasks/tests/test_tasks_api.py:86`: GET, PUT, PATCH and DELETE on another user's task all return 404, and the row is unchanged.
- `backend/tasks/tests/test_tasks_api.py:124`: searching Khmer text works end to end.
- `backend/tasks/tests/test_tasks_api.py:131`: listing tasks uses at most 3 queries, no matter how many rows.
- `backend/tasks/tests/test_models.py`: the database itself rejects an empty title or an unknown status (`IntegrityError`).

## Run it
```bash
git checkout lesson-05
docker compose up -d --wait
cd backend
uv run pytest
```

## Check yourself
`33 passed`. pytest-django creates and destroys a separate `test_taskflow` database, so your dev data is untouched.

## Exercise
Temporarily change `get_queryset` in `backend/tasks/views.py:25` to `Task.objects.all()`, then run the tests. Which tests fail, and what would a real attacker be able to do? Revert afterwards.
