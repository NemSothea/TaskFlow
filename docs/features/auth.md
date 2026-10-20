# Feature: authentication

Register, log in, stay logged in across reloads, and log out, without ever exposing a long-lived token to JavaScript.

## API (`/api/v1/auth/`, `backend/accounts/urls.py`)

| Method | Path | View | Auth | Throttle scope | Result |
|---|---|---|---|---|---|
| POST | `register/` | `RegisterView` | none | `auth` | 201 `{id, username, email}` |
| POST | `login/` | `LoginView` | none | `auth` | 200 `{access, user}`, sets the refresh cookie and the `csrftoken` cookie; bad credentials return 401 |
| POST | `refresh/` | `RefreshView` | refresh cookie + `X-CSRFToken` | `auth_refresh` | 200 `{access}` and a rotated cookie; 401 if the cookie is missing or invalid (the cookie is then cleared) |
| POST | `logout/` | `LogoutView` | refresh cookie + `X-CSRFToken` | none | 204, blacklists the refresh token and clears the cookie |
| GET | `me/` | `MeView` | Bearer access token | none | 200 `{id, username, email}` |

## How it works
- **Access token**: lifetime `ACCESS_TOKEN_MINUTES` (default 5). It is returned in the response body and kept only in memory in `frontend/src/api/client.ts`.
- **Refresh token**: cookie `taskflow_refresh`, `httpOnly`, `SameSite=Lax`, `Secure` when `SECURE_COOKIES`, path `/api/v1/auth/`, lifetime `REFRESH_TOKEN_DAYS` (default 7). SimpleJWT has `ROTATE_REFRESH_TOKENS` and `BLACKLIST_AFTER_ROTATION` on.
- **CSRF**: the refresh and logout views have no authentication classes, so `enforce_csrf` (`backend/accounts/cookies.py`) runs Django's CSRF check explicitly. Axios copies the `csrftoken` cookie into `X-CSRFToken`.
- **Registration**: email is normalized, lowercased and must be unique (case-insensitive). Django's password validators run against the would-be user. The password is write-only.
- **Client refresh**: on a 401, the response interceptor calls `refreshAccessToken()` once and retries the request. Concurrent callers share one in-flight refresh. Auth endpoints pass `skipAuthRefresh`. If the refresh fails, `onSessionExpired` fires.
- **Session restore**: on load, `AuthProvider` calls `refreshAccessToken()` then `fetchMe()`. Status is `loading`, then `authenticated` or `anonymous`.
- **Routing**: `ProtectedRoute` sends anonymous users to `/login` and keeps the original path in `state.from`. `GuestRoute` sends signed-in users away from `/login` and `/register` to `/`.

## Files
- Backend: `backend/accounts/` (`models.py` custom `User` with unique email, `serializers.py`, `views.py`, `cookies.py`, `urls.py`), and the `SIMPLE_JWT`, `REFRESH_COOKIE_*` and throttle settings in `backend/config/settings.py`.
- Frontend: `frontend/src/api/client.ts`, `frontend/src/api/auth.ts`, `frontend/src/features/auth/` (`AuthProvider.tsx`, `context.ts`, `RouteGuards.tsx`, `LoginPage.tsx`, `RegisterPage.tsx`, `AuthLayout.tsx`).

## Tests
- `backend/accounts/tests/test_auth.py`: register (no password echoed, weak password, duplicate email case-insensitive), login (httpOnly cookie, wrong password 401, throttling), refresh (CSRF required, rotation + blacklist, missing cookie 401), logout (blacklists), me (requires auth, returns the current user).
- `frontend/src/api/client.test.ts`: bearer header, refresh once and retry, shared concurrent refresh, session-expiry signal, no refresh for auth endpoints.
- `frontend/src/features/auth/RouteGuards.test.tsx`: redirect anonymous users, allow authenticated users, bounce signed-in users from login, show a spinner while loading.

## Rules
The auth model is locked. See "Auth model" in `CLAUDE.md`. Do not change it without discussion.
