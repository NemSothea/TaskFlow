---
name: add-api-endpoint
description: Add a new REST endpoint end to end (DRF view or viewset action, serializer, URL, pytest, TypeScript types, typed service function, vitest). Use when the user asks for a new API route or action, e.g. "add an endpoint to archive tasks", "expose task stats by priority", "add a bulk delete API".
---

# Add an API endpoint

Work through the steps in order. Each step names the exact file. Keep the change minimal: one endpoint, no unrelated refactors.

## 0. Clarify
Confirm the HTTP method, path, request body, response shape, who may call it, and whether it is per-user data. Ask if any of these is unclear. If it changes the auth flow, stop: the Auth model in `CLAUDE.md` is not changed without discussion.

## 1. Where it lives
- Acts on tasks: add an `@action` to `TaskViewSet` in `backend/tasks/views.py`, following `summary`. The router in `backend/tasks/urls.py` picks it up; no URL change needed.
- New resource: a new viewset registered on the router in `backend/tasks/urls.py` (or the owning app's `urls.py`). App URLs are mounted under `api/v1/` in `backend/config/urls.py`.
- Auth-related: `backend/accounts/views.py` + `backend/accounts/urls.py` (mounted at `api/v1/auth/`).

## 2. View rules (`views.py`)
- Build every queryset from `self.get_queryset()` or `Task.objects.filter(owner=request.user)`. Another user's object must return 404, not 403.
- Keep the default `IsAuthenticated` permission. Never set `permission_classes = []` or `AllowAny` unless the endpoint is genuinely public, and ask first.
- Unauthenticated or abuse-prone endpoints get a `throttle_scope`. Add a new scope rate in `backend/config/settings.py` `DEFAULT_THROTTLE_RATES`, read from env with a default, following `AUTH_THROTTLE_RATE`.
- Never disable CSRF on cookie-authenticated endpoints.

## 3. Serializer (`serializers.py`)
- Validate input with a serializer, never by reading `request.data` by hand. `owner` is never a writable field. Set it in `perform_create` or `save(owner=...)`.

## 4. Backend tests (`backend/<app>/tests/`)
- Happy path with the expected status code and body.
- 401 without a token, 404 for another user's object, 400 for invalid input, and 429 if throttled.
- Run `uv run pytest` from `backend/`.

## 5. Types (`frontend/src/api/types.ts`)
- Add request and response types that mirror the serializer exactly.

## 6. Service (`frontend/src/api/tasks.ts`, or `auth.ts`)
- Add one `async` function that uses `api` from `./client`, following `getTaskSummary`. Accept an optional `signal?: AbortSignal` for GET requests. Never create another axios instance.

## 7. Frontend tests
- If the function has logic beyond a plain call, cover it in a vitest next to the file, mocking with `axios-mock-adapter` as `client.test.ts` does.

## 8. Docs
- Add the endpoint to the API table in `README.md` and to `docs/features/<feature>.md`.

## 9. Verify
Run `/check`, which must be all PASS. Then summarize the files changed and the new endpoint's method and path.
