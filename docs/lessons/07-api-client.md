# Lesson 07: API client

## Goal
One Axios instance that attaches the access token, refreshes it transparently on a 401, and turns any error into a typed, predictable shape.

## Concepts
- **Access token in memory only.** A module-level variable. A page reload loses it, and the refresh cookie gets a new one.
- **Single-flight refresh.** Because the server rotates refresh tokens, two parallel refresh calls would invalidate each other and log the user out. React StrictMode runs effects twice in development, so this is a real problem, not a hypothetical one. All callers share one in-flight promise.
- **Retry once.** A request that gets a 401 is retried exactly once after refresh (`_retried`). That prevents infinite loops.
- **Typed contracts.** `types.ts` mirrors the DRF serializers, so a backend change shows up as a compile error.
- **One error shape.** `parseApiError` normalizes network errors, cancellations, `{detail}` and `{field: [msgs]}`.

## Files touched
- `frontend/src/api/client.ts`, `auth.ts`, `tasks.ts`, `types.ts`, `errors.ts`
- `frontend/src/lib/storage.ts`, `forms.ts`, `useDebouncedValue.ts`

## Walkthrough
- `frontend/src/api/client.ts:13-19`: the instance. `withCredentials`, and `xsrfCookieName`/`xsrfHeaderName` so Axios copies the CSRF cookie into the header.
- `frontend/src/api/client.ts:21`: `let accessToken`. Never stored in `localStorage`.
- `frontend/src/api/client.ts:41-52`: `refreshAccessToken`. `refreshInFlight ??=` is the single-flight lock, cleared in `finally`.
- `frontend/src/api/client.ts:61-82`: the response interceptor. On a 401 it refreshes and retries, and if the refresh fails it calls `onSessionExpired`.
- `frontend/src/api/client.ts:88-93`: module augmentation adds a typed `skipAuthRefresh` option for the auth endpoints.
- `frontend/src/api/errors.ts:15`: `parseApiError`.
- `frontend/src/lib/forms.ts:9`: `applyFieldErrors` puts server validation messages on the matching form fields.
- `frontend/src/lib/storage.ts`: `localStorage` wrapped in `try/catch`.

## Run it
```bash
git checkout lesson-07
cd frontend
npm run typecheck
```

## Check yourself
At this tag only the API layer exists. Type-checking it is the useful check; there is no UI yet.

## Exercise
Delete the `??=` and write `refreshInFlight = api.post(...)` instead. Which test in lesson 11 (`client.test.ts`, "shares one refresh between concurrent callers") would catch it? Revert afterwards.
