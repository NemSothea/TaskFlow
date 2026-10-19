# Lesson 03: Accounts and cookie-based JWT auth

## Goal
Add registration and login. The browser keeps a short-lived access token in memory and a long-lived refresh token in an httpOnly cookie.

## Concepts
- **Custom user model.** It extends `AbstractUser` so you can add fields later without a migration nightmare. Email is unique.
- **Why not localStorage?** Any XSS bug can read `localStorage`. An `httpOnly` cookie is invisible to JavaScript.
- **Rotation and blacklist.** Every refresh issues a new refresh token and blacklists the old one, so a stolen, replayed token stops working.
- **CSRF.** Cookies are sent automatically by the browser, so the cookie-authenticated endpoints (refresh, logout) need a CSRF check. Endpoints that use a Bearer header do not.
- **Throttling.** Login and register are rate-limited per IP against brute force. Refresh has its own bucket, so failed logins can't block legitimate session renewal.

## Files touched
- `backend/accounts/models.py`, `serializers.py`, `cookies.py`, `views.py`, `urls.py`, `admin.py`, `apps.py`
- `backend/accounts/migrations/0001_initial.py`

## Walkthrough
- `backend/accounts/models.py:5-8`: `User(AbstractUser)` with `email = EmailField(unique=True)`.
- `backend/accounts/serializers.py:15`: `RegisterSerializer`. `password` is write-only, email is normalized and checked case-insensitively, and Django's password validators run against the would-be user.
- `backend/accounts/cookies.py:8`: `set_refresh_cookie`. `httponly=True`, `samesite="Lax"`, `path="/api/v1/auth/"`, so the cookie is only sent to auth endpoints.
- `backend/accounts/cookies.py:28`: `enforce_csrf`. DRF views are CSRF-exempt by default, so the check runs explicitly, the same way DRF's `SessionAuthentication` does it.
- `backend/accounts/views.py:25-52`: `LoginView` returns `{access, user}`, sets the cookie, and makes sure a `csrftoken` cookie exists.
- `backend/accounts/views.py:32`: `get_authenticate_header`. Without it, DRF turns bad credentials into 403 instead of 401 on views with no authentication classes.
- `backend/accounts/views.py:55-83`: `RefreshView` checks CSRF, reads the cookie, rotates the token, and sets the new cookie. An invalid token clears the cookie and returns 401.
- `backend/accounts/views.py:86-100`: `LogoutView` blacklists the token and deletes the cookie.

## Run it
```bash
git checkout lesson-03
git show --stat
```

## Check yourself
Read the code at this tag. Django still won't start because `config/urls.py` and the settings reference the `tasks` app (lesson 04).

## Exercise
Draw the sequence diagram for: login → access token expires → API call returns 401 → refresh → retry. Which requests carry the cookie, and which carry the `Authorization` header?
