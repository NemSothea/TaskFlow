# Lesson 10: Tasks page

## Goal
The main screen: summary counts, search, filters, sorting and pagination, plus create, edit, complete and delete. Works on phones and desktops, with proper loading, empty and error states.

## Concepts
- **The URL is the state.** Filters, sort and page live in `?search=&status=&page=`. Back and forward work, links are shareable, and a reload keeps your view.
- **Never trust the URL.** `queryFromParams` validates every value against allowlists before it reaches the API.
- **Stale responses.** Each new query aborts the previous request (`AbortController`), so a slow old response can't overwrite a newer one.
- **Debounced search.** One request after typing stops (350 ms), not one per keystroke.
- **All UI states.** Loading (skeleton or spinner), empty with no tasks, empty because of filters (with "Clear filters"), error with Retry, and success.
- **Responsive by component.** Ant Design `Table` on `md` and up, stacked `Card`s on phones.

## Files touched
- `frontend/src/features/tasks/TasksPage.tsx`, `TaskList.tsx`, `TaskFilters.tsx`, `TaskFormModal.tsx`, `TaskActions.tsx`, `TaskMeta.tsx`, `TaskSummaryCards.tsx`, `query.ts`, `useAsync.ts`

## Walkthrough
- `frontend/src/features/tasks/TasksPage.tsx:23-24`: the query is derived from `useSearchParams`.
- `frontend/src/features/tasks/query.ts:28`: `queryFromParams` uses allowlists, and invalid values fall back to defaults.
- `frontend/src/features/tasks/useAsync.ts:16-33`: fetch with abort on dependency change, plus a `reload()` for Retry and after mutations.
- `frontend/src/features/tasks/TaskFilters.tsx:24`: debounced search.
- `frontend/src/features/tasks/TasksPage.tsx:69`: deleting the last item on page N goes back to page N-1 instead of leaving an empty page.
- `frontend/src/features/tasks/TaskList.tsx:23`: `screens.md === false`. `useBreakpoint()` is empty on the first render, so the code defaults to the table.
- `frontend/src/features/tasks/TaskFormModal.tsx`: client validation that mirrors the server (required, max 200 characters), with server field errors mapped back onto the form.
- `frontend/src/features/tasks/TaskActions.tsx`: icon buttons with an `aria-label` that includes the task title, so screen readers say "Delete: Buy milk", not just "Delete".

## Run it
```bash
git checkout lesson-10
docker compose up -d --wait
(cd backend && uv run python manage.py migrate && uv run python manage.py runserver 127.0.0.1:8000) &
cd frontend && npm run dev
```
Open http://localhost:5173, register, and log in.

## Check yourself
- `npm run typecheck` and `npm run build` pass.
- Create a task, search for it, filter by status, then press the browser Back button. The previous filter comes back.
- Reload the page. You are still logged in, thanks to the refresh cookie.
- Switch to ខ្មែរ and dark mode, then reload. Both choices persist.

## Exercise
Add a "Due date" quick filter for overdue tasks. Should the filtering happen on the server or on the client, and why? (Hint: pagination.)
