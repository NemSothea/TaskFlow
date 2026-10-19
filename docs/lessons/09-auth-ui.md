# Lesson 09: Auth UI and app shell

## Goal
Login and register pages, session restore on page load, and route guards that send users to the right place.

## Concepts
- **Session restore.** On first load, there is no access token in memory. `AuthProvider` calls refresh, which uses the cookie, then `/auth/me/`. The status starts as `loading`, so guards show a spinner instead of flashing the login page.
- **Route guards as layout routes.** `<ProtectedRoute>` and `<GuestRoute>` wrap groups of routes with `<Outlet/>`.
- **Return to where you were.** The guard saves `from`, and login only follows same-app paths (it must start with `/` and not `//`). That prevents open redirects.
- **Server errors on fields.** Register maps DRF field errors (for example "email already exists") onto the form inputs.
- **Code splitting.** `React.lazy` pages mean the login screen doesn't download the task table and date picker.
- **Accessibility.** Real `<label>`s from `Form.Item`, an `aria-label` on icon buttons, `role="alert"` on errors, and `role="status"` on the spinner.

## Files touched
- `frontend/src/features/auth/AuthProvider.tsx`, `context.ts`, `RouteGuards.tsx`, `LoginPage.tsx`, `RegisterPage.tsx`, `AuthLayout.tsx`
- `frontend/src/components/AppLayout.tsx`, `PreferenceControls.tsx`, `ErrorState.tsx`, `FullPageSpinner.tsx`, `NotFoundPage.tsx`
- `frontend/src/App.tsx`, `frontend/src/main.tsx`, `frontend/src/index.css`

## Walkthrough
- `frontend/src/features/auth/AuthProvider.tsx:16`: restore the session with `refreshAccessToken()` then `fetchMe()`. The effect's `AbortController` handles StrictMode's double run.
- `frontend/src/features/auth/AuthProvider.tsx:31`: registers the handler that runs when the API client's refresh fails, and sets `sessionExpired`.
- `frontend/src/features/auth/RouteGuards.tsx:13`: redirect to login, keeping `from`.
- `frontend/src/features/auth/LoginPage.tsx:32`: the open-redirect guard.
- `frontend/src/features/auth/RegisterPage.tsx:30`: `applyFieldErrors`.
- `frontend/src/App.tsx:11-15`: lazy routes inside `<Suspense>`.
- `frontend/src/index.css:7`: Tailwind theme and utilities in cascade layers, with no preflight.

## Run it
```bash
git checkout lesson-09
cd frontend
npm run typecheck
```

## Check yourself
Type-checking **fails at this tag**: `App.tsx` lazy-imports `features/tasks/TasksPage`, which arrives in lesson 10. The auth files themselves are complete; read them here and run them in lesson 10.

## Exercise
Log in at `/login?x=1` after visiting `/?status=done` while logged out. Where do you land? Then try to craft a `from` value that leaves the site, and explain why it fails.
