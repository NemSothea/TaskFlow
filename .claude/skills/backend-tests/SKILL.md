---
name: backend-tests
description: Decide what to test in the Django backend and write the pytest-django tests (model rules, serializer logic, API contract, security, query counts). Use when adding or changing backend behavior, when asked to "add tests", "cover this endpoint", or "improve backend coverage", or when a reviewer reports missing backend tests.
---

# Backend tests

Tests prove behavior an API client can observe, plus the rules the database enforces. Test through the HTTP API whenever possible. Call internals directly only for model constraints.

## 0. Setup you already have (`backend/conftest.py`)
- `api_client`: anonymous `APIClient`.
- `make_user(username="alice", password=..., **extra)`: creates a user.
- `auth_client(user=None)`: returns `(client, user)` with a real Bearer access token.
- Throttle cache is cleared before every test automatically.
- Mark database tests with `pytestmark = pytest.mark.django_db`. Tests need Postgres: run `docker compose up -d --wait` from the root.

## 1. Pick the layers that apply

| Layer | Where | Prove |
|---|---|---|
| Model rules | `<app>/tests/test_models.py` | `CheckConstraint`s reject bad rows (`IntegrityError` inside `transaction.atomic()`), defaults, cascade deletes |
| Logic | `<app>/tests/test_*_api.py` | Serializer validation through the endpoint: trimming, normalization, uniqueness, cross-field rules |
| API contract | same | Status code **and** response shape (exact keys) for every method |
| Security | same | 401 without a token, 404 (not 403) for another user's object, `owner` ignored if sent, CSRF on cookie endpoints, 429 when throttled |
| Performance | same | `django_assert_max_num_queries` on list endpoints, with enough rows to expose N+1 queries |

## 2. Required matrix per endpoint
For every new or changed endpoint, write at least:
1. Happy path: status code and exact response keys.
2. Invalid input: 400, and the field name appears in the error body.
3. Anonymous: 401.
4. Ownership: another user's object returns 404 for GET, PATCH, PUT and DELETE. Parametrize over methods, following `TestOwnershipIsolation`.
5. Throttled endpoints: the request after the limit returns 429.
6. List endpoints: filters, search, ordering, pagination shape, the page-size cap, and a constant query count.

## 3. Style
- Group tests in a class per behavior (`TestCrud`, `TestOwnershipIsolation`), following the existing files.
- Name tests after the behavior: `test_cannot_access_other_users_task`, not `test_get_2`.
- One behavior per test. Build data inline, or with small local fixtures (`alice`, `bobs_task`), not shared mega-fixtures.
- Use realistic data, including Khmer text where search or validation is involved.
- Assert on what a client sees: status codes, JSON and cookies. Do not assert on private helpers.
- Never weaken a test to make it pass. A failing test is either a test bug or a code bug; say which.

## 4. Run
From `backend/`: `uv run pytest <path> -q`, then `uv run pytest` for the full suite. Finish with `../scripts/check-backend.sh`.
