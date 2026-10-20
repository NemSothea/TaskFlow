---
name: frontend-tests
description: Decide what to test in the React frontend and write Vitest + Testing Library tests that check user experience (what the user sees and does), logic, page flows with mocked HTTP, i18n, and accessibility with axe; plus Playwright end-to-end tests for critical journeys. Use when adding or changing UI or frontend logic, when asked to "add tests", "test the UX", "cover this page", or when a reviewer reports missing frontend tests.
---

# Frontend tests

Test what the user experiences, not how the component is built. If a refactor changes no behavior, no test should break.

## 0. Setup you already have
- `src/test/setup.ts`: jest-dom matchers, cleanup, and `matchMedia`/`ResizeObserver` stubs for Ant Design.
- `src/test/render.tsx`: `renderWithProviders(ui, { route })` wraps with `MemoryRouter`, i18n and `PreferencesProvider` (Ant Design `App`, so `message.*` works).
- `src/test/http.ts`: `mockApi()` returns an `axios-mock-adapter` on the shared `api` instance; call `.restore()` in `afterEach`.
- `src/test/axe.ts`: `expectNoA11yViolations(container)` (axe-core; `color-contrast` is off because jsdom does no layout).
- `src/test/LocationProbe.tsx`: renders `pathname + search` as `role="status"` named `location`, for asserting redirects and URL-synced filters.
- `src/test/auth.tsx`: `renderAuthApp(route)` renders the real `AuthProvider` + login/register pages. Mock `POST /auth/refresh/` first (401 = signed out).
- `e2e/`: Playwright tests against the real stack (`scripts/e2e.sh`).

## 1. Pick the layer

| Layer | Use for | Tooling | Example |
|---|---|---|---|
| Logic | Pure functions and hooks: parsing, formatting, error mapping | Vitest only | `query.test.ts`, `errors.test.ts` |
| Component UX | One component: user input, validation, emitted payload | `renderWithProviders` + `userEvent` | `TaskFormModal.test.tsx` |
| Page flow | A page with mocked HTTP: load, filter, create, edit, delete, error and empty states | `renderWithProviders` + `mockApi()` | `TasksPage.test.tsx` |
| i18n / theme | Switching language or theme updates the UI and persists | `renderWithProviders` | `PreferenceControls.test.tsx` |
| Accessibility | No axe violations on each page state | `expectNoA11yViolations` | inside page tests |
| End-to-end | Critical journeys across the real API, cookies and reloads | Playwright | `e2e/tasks.spec.ts` |

Default to the **page flow** layer for UI work: it catches the most real bugs per test. Use E2E only for journeys that need the real backend (auth cookies, reload persistence). Keep the E2E suite small.

## 2. Every page or component covers its states
- **Loading**: a spinner or skeleton is visible and the action is disabled.
- **Empty**: the empty message and its call to action (with and without active filters).
- **Error**: a network error (no response) and a server error (500) each show the right message, and Retry works.
- **Success**: data is rendered, and a mutation shows a success message and refreshes the data.
- **Validation**: required fields and server field errors appear next to the right field.

## 3. Rules
- Query like a user: `getByRole(name)`, then `getByLabelText`, then `getByText`. Never use `container.querySelector`, class names or test IDs unless no accessible query exists. If none exists, that is an accessibility bug: report it.
- Interact with `userEvent` (`const user = userEvent.setup()`), not `fireEvent`.
- Mock HTTP at the axios layer with `mockApi()`. Never mock our own components, hooks or `src/api/*` services in page tests.
- Assert on visible results (text, roles, URL) and on the request sent (`mock.history`), not on component state or call counts of internals.
- Use `findBy*` / `waitFor` for async UI. Never use fixed `setTimeout` sleeps.
- Use the English strings from `src/i18n/locales/en.ts` in assertions. For i18n tests, switch the language and assert the Khmer string from `km.ts`.
- Reset global state in `afterEach`: `mock.restore()`, `localStorage.clear()`, `i18n.changeLanguage('en')`, `setAccessToken(null)`.
- Ant Design specifics:
  - `Select` options render in a portal: open the combobox, then pick with `findByRole('option', …)` or `findByTitle`.
  - `Popconfirm` buttons appear only after clicking the trigger. `message.*` text appears in the document body.
  - Under NODE_ENV=test every generated id is `test-id`, so `aria-labelledby` names are unreliable. Find a modal with `findByRole('dialog')` and check its `.ant-modal-title` text.
  - Forms with `requiredMark="optional"` add "(optional)" to labels: use `getByLabelText(/^Description/)`.
  - jsdom has no breakpoints, so `Grid.useBreakpoint()` reports mobile and `TaskList` renders cards, not a table.
- Node 25+ shadows jsdom's `localStorage` with a stub; `src/test/setup.ts` installs an in-memory Storage. Never mock `src/lib/storage.ts`.

## 4. Page-flow template
```tsx
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type MockAdapter from 'axios-mock-adapter'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { expectNoA11yViolations } from '../../test/axe'
import { mockApi } from '../../test/http'
import { renderWithProviders } from '../../test/render'
import { SomePage } from './SomePage'

let mock: MockAdapter
beforeEach(() => {
  mock = mockApi()
})
afterEach(() => mock.restore())

describe('SomePage', () => {
  it('shows the data the API returns', async () => {
    mock.onGet('/things/').reply(200, { results: [{ id: 1, name: 'First' }] })
    const { container } = renderWithProviders(<SomePage />)

    expect(await screen.findByText('First')).toBeInTheDocument()
    await expectNoA11yViolations(container)
  })
})
```

## 5. End-to-end (Playwright, `e2e/`)
- Cover only critical journeys: register, then log in, create a task, reload (still logged in), log out; ownership between two users; the mobile viewport.
- Create unique users per test (`user-${Date.now()}`) so tests never depend on each other or on existing data.
- Use the same role-based queries (`page.getByRole`, `page.getByLabel`).
- Run with `scripts/e2e.sh`, which needs Docker and starts the stack.

## 6. Run
From `frontend/`: `npm test -- <path>`, then `npm test`. Finish with `../scripts/check-frontend.sh`. E2E: `scripts/e2e.sh` from the root.
