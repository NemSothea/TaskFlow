# Feature: dashboard

The top of the tasks page answers "where do I stand?" before the user reaches the list: a greeting and overall progress, per-status counts, and three charts.
Visual rules are in `docs/design-system.md`. The list, filters and CRUD are in `docs/features/tasks.md`.

> This spec was written after the first version shipped (see "History"). From now on, dashboard changes update this file before code.

## Goals
- Show progress at a glance: share done, open count, overdue.
- Make the page feel alive without hurting speed, accessibility or reduced-motion users.
- Reuse the data the page already loads where possible. Add one endpoint for chart data.

## Non-goals
- Date-range filters on the charts. They always show the current state and the last 8 weeks.
- Completed-per-week or burndown charts. These need a `completed_at` field (see "Open work").
- Team or cross-user analytics. Everything is per user.

## Layout (top to bottom)
1. **Hero** (`TasksHero.tsx`): a time-of-day greeting with the username, the `h1` "My tasks", the open count (or "All caught up" when everything is done), the "New task" button, and a progress ring showing the percentage done. Completing a task triggers a burst and a ring pop.
2. **Summary cards** (`TaskSummaryCards.tsx`): Total, To do, In progress and Done. Each count counts up, and each card toggles the status filter.
3. **Charts** (`charts/TaskCharts.tsx`):
   - **Status breakdown** (`StatusChart`): a bar per status, scaled to the largest, labelled with count and percent, plus Overdue and Due-this-week tiles.
   - **Priority by status** (`PriorityChart`): a stacked bar per priority (high to low), segmented To do, In progress, Done, with a legend.
   - **New tasks per week** (`WeeklyChart`): 8 columns, brand color, with the latest and the peak labelled.
4. Filters and the task list (unchanged).

States:
- **Loading:** skeleton cards.
- **Refetch:** the previous render stays, dimmed.
- **Stats failed:** a warning alert with Retry. The list still works.
- **Brand-new account (total 0):** charts are hidden, and the empty state invites the user to create a task.

## API

| Method | Path | Result |
|---|---|---|
| GET | `/api/v1/tasks/summary/` | `{todo, in_progress, done, total}` (existing) |
| GET | `/api/v1/tasks/stats/` | See below (new, `TaskViewSet.stats`) |

```json
{
  "by_priority": [
    {"priority": "high", "todo": 2, "in_progress": 1, "done": 0},
    {"priority": "medium", "todo": 3, "in_progress": 2, "done": 1},
    {"priority": "low", "todo": 2, "in_progress": 0, "done": 2}
  ],
  "created_per_week": [{"week_start": "2026-08-31", "count": 0}, "... 8 entries, oldest first"],
  "overdue": 4,
  "due_this_week": 2
}
```

- The endpoint needs authentication and is scoped to `request.user`, like every task endpoint.
- `by_priority` is always 3 rows, high to low, with zero-filled statuses.
- `created_per_week` is the last 8 weeks, each starting on a Monday in the server time zone (`TIME_ZONE = "UTC"`), zero-filled.
- `overdue` counts open tasks with `due_date < today`. `due_this_week` counts open tasks due from today through Sunday. Done tasks never count.
- The endpoint makes 3 queries, regardless of the number of tasks.
- The page fetches `summary` and `stats` in parallel. After any create, update, complete or delete, both are refetched.

## Files

| Area | Files |
|---|---|
| Backend | `backend/tasks/views.py` (`stats`, `STATS_WEEKS = 8`), `backend/tasks/management/commands/seed_demo.py` (`CREATED_DAYS_AGO` backdates the demo tasks) |
| API client | `frontend/src/api/types.ts` (`TaskStats`), `frontend/src/api/tasks.ts` (`getTaskStats`) |
| Page | `frontend/src/features/tasks/TasksPage.tsx`, `TasksHero.tsx`, `ProgressRing.tsx`, `greeting.ts`, `TaskSummaryCards.tsx` |
| Charts | `frontend/src/features/tasks/charts/` (`TaskCharts`, `StatusChart`, `PriorityChart`, `WeeklyChart`, `ChartCard` + `ChartTable`, `colors.ts`, `scale.ts`) |
| Shared | `frontend/src/components/AnimatedNumber.tsx`, `Burst.tsx`, `frontend/src/lib/motion.ts`, `frontend/src/preferences/brand.ts` |
| Strings | `tasks.hero.*`, `tasks.charts.*` in `en.ts` and `km.ts` |

## Tests
- **`backend/tasks/tests/test_tasks_api.py::TestStats`:** 401 when anonymous, zero-filled shape, counts per priority, Monday week buckets (including the 8-week cut-off), deadlines ignore done tasks, own tasks only.
- **`backend/tasks/tests/test_seed_demo.py`:** demo tasks are spread over at least 6 weeks.
- **`frontend/src/features/tasks/TasksPage.test.tsx`:**
  - greeting and open count
  - "All caught up"
  - the progress ring's accessible value
  - chart table twins (priority row values, status percentages, 8 weeks)
  - deadline tiles
  - stats failure with retry
  - axe
- **Unit tests:**
  - `greeting.test.ts`: hour boundaries
  - `charts/scale.test.ts`: `niceCeil`, `percentOf`, `parseLocalDate`
  - `charts/colors.test.ts`: `inkOn` contrast choice
- **Manual check:** light, dark, Khmer, 390/820/1440px, reduced motion. Complete a task to see the burst.

## Open work
- **`completed_at` on `Task`** (`docs/erd.md`, Roadmap phase 1). Set it when the status becomes done and clear it when it leaves done. This needs a migration, an ERD update, and serializer and API changes. It enables "completed per week" and a burndown chart. Ask before changing the model.
- **Align status tags.** The tags in the list (`TaskMeta.tsx`) still use Ant Design preset colors. They should use the status palette.
- **Clickable charts.** Clicking a chart segment could apply the matching filter, as the summary cards do.
- **Time zone.** Week buckets use the server time zone (UTC), so a user far from UTC can see a task near midnight land in the neighbouring week.
- **E2E.** No Playwright journey covers the dashboard yet. Add one that completes a task and checks that the counts and charts update.

## History
- **Round 1:** Motion added, and Plus Jakarta Sans. The animations were subtle and the user found it "not interesting".
- **Round 2:** hero gradient, progress ring, count-ups and completion burst. The sign-in page got a gradient brand panel.
- **Round 3:** charts and the `tasks/stats/` endpoint, after the user asked for bar charts of completed, in-progress and total.
- **Lesson:** the target was not agreed before coding, which cost two extra rounds. Write and confirm this spec first next time.
