# Feature: tasks

Each user creates, lists, filters, edits and deletes their own tasks, and sees per-status counts. Users never see each other's tasks.

## API (`/api/v1/`, `backend/tasks/urls.py`, `TaskViewSet` on a `DefaultRouter`)

All endpoints need `Authorization: Bearer <access>`.

| Method | Path | Result |
|---|---|---|
| GET | `tasks/` | Paginated list `{count, next, previous, results}` |
| POST | `tasks/` | 201 with the created task; `owner` comes from `request.user` |
| GET / PUT / PATCH / DELETE | `tasks/{id}/` | Own tasks only; another user's task returns 404 |
| GET | `tasks/summary/` | `{todo, in_progress, done, total}` for the current user |

List query parameters:
- `page`, `page_size` (default 10, capped at 100; `StandardPagination`)
- `status`, `priority` (exact match; `filterset_fields`)
- `search` (`title`, `description`)
- `ordering`: `created_at`, `updated_at`, `due_date`, `title`, optionally prefixed with `-`. Default `-created_at`.

## Model (`backend/tasks/models.py`)
- Fields: `owner` (FK, cascade delete), `title` (≤200), `description`, `status` (`todo` / `in_progress` / `done`, default `todo`), `priority` (`low` / `medium` / `high`, default `medium`), `due_date` (optional), `created_at`, `updated_at`.
- Database constraints: non-empty title, valid status, valid priority.
- Indexes: `(owner, status)`, `(owner, due_date)`, `(owner, -created_at)`.
- The serializer strips `title` and rejects a blank title. `id`, `created_at` and `updated_at` are read-only, and `owner` is not exposed.

## Frontend (`frontend/src/features/tasks/`)
- `TasksPage.tsx`: the page. Filters are synced to the URL through `query.ts` (`queryFromParams`, `hasActiveFilters`).
- `TaskFilters.tsx`, `TaskList.tsx` (table plus mobile cards), `TaskSummaryCards.tsx`, `TaskFormModal.tsx` (create and edit), `TaskActions.tsx`, `TaskMeta.tsx`, `useAsync.ts`.
- API calls are in `frontend/src/api/tasks.ts`: `listTasks`, `getTaskSummary`, `createTask`, `updateTask` (PATCH), `deleteTask`. Types are in `frontend/src/api/types.ts`.

## Tests
- `backend/tasks/tests/test_tasks_api.py`: authentication, CRUD (owner from the request, blank title and invalid status rejected, partial update, delete), ownership isolation (list, 404 on other users' tasks, summary), listing (pagination shape, page-size cap, filter + search, Khmer search, constant query count).
- `backend/tasks/tests/test_models.py`: database rejects an empty title and an unknown status; tasks are deleted with their owner.
- `frontend/src/features/tasks/query.test.ts`: URL param defaults, invalid values dropped, round trip, `hasActiveFilters`.
- `frontend/src/features/tasks/TaskFormModal.test.tsx`: title validation, trimmed submit payload with defaults.

## Extending
- New field: use the `add-task-field` skill.
- New endpoint or action: use the `add-api-endpoint` skill.
