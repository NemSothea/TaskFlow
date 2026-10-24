import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type MockAdapter from 'axios-mock-adapter'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import type { Paginated, Task, TaskStats, TaskSummary } from '../../api/types'
import { AuthContext, type AuthContextValue } from '../auth/context'
import { expectNoA11yViolations } from '../../test/axe'
import { mockApi } from '../../test/http'
import { LocationProbe } from '../../test/LocationProbe'
import { renderWithProviders } from '../../test/render'
import { TasksPage } from './TasksPage'

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 1,
    title: 'Buy milk',
    description: '',
    status: 'todo',
    priority: 'medium',
    due_date: null,
    created_at: '2026-10-01T09:00:00Z',
    updated_at: '2026-10-01T09:00:00Z',
    ...overrides,
  }
}

function page(results: Task[], count = results.length): Paginated<Task> {
  return { count, next: null, previous: null, results }
}

const SUMMARY: TaskSummary = { todo: 4, in_progress: 2, done: 1, total: 7 }

const STATS: TaskStats = {
  by_priority: [
    { priority: 'high', todo: 2, in_progress: 1, done: 0 },
    { priority: 'medium', todo: 1, in_progress: 1, done: 1 },
    { priority: 'low', todo: 1, in_progress: 0, done: 0 },
  ],
  created_per_week: ['08-31', '09-07', '09-14', '09-21', '09-28', '10-05', '10-12', '10-19'].map((day, i) => ({
    week_start: `2026-${day}`,
    count: i,
  })),
  overdue: 2,
  due_this_week: 5,
}

const signedIn: AuthContextValue = {
  status: 'authenticated',
  user: { id: 1, username: 'demo', email: 'demo@example.com' },
  sessionExpired: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
}

function renderPage(route = '/') {
  return renderWithProviders(
    <AuthContext.Provider value={signedIn}>
      <TasksPage />
      <LocationProbe />
    </AuthContext.Provider>,
    { route },
  )
}

/**
 * Ant Design gives every generated id the value "test-id" under NODE_ENV=test, so
 * aria-labelledby cannot name the dialog reliably. Find it by role, then check its title.
 */
async function findDialog(title: string) {
  const dialog = await screen.findByRole('dialog')
  expect(within(dialog).getByText(title, { selector: '.ant-modal-title' })).toBeInTheDocument()
  return dialog
}

const location = () => screen.getByRole('status', { name: 'location' })
const taskListRequests = () => mock.history.get.filter((r) => r.url === '/tasks/')
const lastListParams = () => taskListRequests().at(-1)?.params as Record<string, unknown>

let mock: MockAdapter

beforeEach(() => {
  mock = mockApi()
  mock.onGet('/tasks/summary/').reply(200, SUMMARY)
  mock.onGet('/tasks/stats/').reply(200, STATS)
})

afterEach(() => mock.restore())

describe('TasksPage', () => {
  describe('loading data', () => {
    it('shows the tasks and the summary counts', async () => {
      mock.onGet('/tasks/').reply(200, page([makeTask(), makeTask({ id: 2, title: 'Pay rent' })]))
      const { container } = renderPage()

      expect(await screen.findByText('Buy milk')).toBeInTheDocument()
      expect(screen.getByText('Pay rent')).toBeInTheDocument()
      expect(await screen.findByRole('button', { name: /^Total/ })).toHaveTextContent('7')
      expect(screen.getByRole('heading', { name: 'My tasks' })).toBeInTheDocument()
      await expectNoA11yViolations(container)
    })

    it('reads filters from the URL and sends them to the API', async () => {
      mock.onGet('/tasks/').reply(200, page([makeTask({ status: 'done' })]))
      renderPage('/?status=done&search=milk&page=2')

      await screen.findByText('Buy milk')
      expect(lastListParams()).toMatchObject({ status: 'done', search: 'milk', page: 2, page_size: 10 })
    })

    it('ignores invalid filter values in the URL', async () => {
      mock.onGet('/tasks/').reply(200, page([makeTask()]))
      renderPage('/?status=bogus&page=-3')

      await screen.findByText('Buy milk')
      expect(lastListParams()).toMatchObject({ page: 1 })
      expect(lastListParams().status).toBeUndefined()
    })
  })

  describe('charts', () => {
    it('shows status, priority and weekly data, each with a table twin', async () => {
      mock.onGet('/tasks/').reply(200, page([makeTask()]))
      const { container } = renderPage()

      const priority = await screen.findByRole('table', { name: 'Priority by status' })
      const high = within(priority).getByRole('row', { name: /High/ })
      expect(within(high).getAllByRole('cell').map((cell) => cell.textContent)).toEqual(['2', '1', '0'])

      const status = screen.getByRole('table', { name: 'Status breakdown' })
      expect(within(status).getByRole('row', { name: /To do/ })).toHaveTextContent('457%')

      const weekly = screen.getByRole('table', { name: 'New tasks per week' })
      expect(within(weekly).getAllByRole('row')).toHaveLength(9) // header + 8 weeks
      await expectNoA11yViolations(container)
    })

    it('shows overdue and due-this-week counts', async () => {
      mock.onGet('/tasks/').reply(200, page([makeTask()]))
      renderPage()

      expect((await screen.findByText('Due this week')).parentElement).toHaveTextContent('5')
      expect(screen.getByText('Overdue').parentElement).toHaveTextContent('2')
    })

    it('offers a retry when the chart data fails to load', async () => {
      const user = userEvent.setup()
      mock.onGet('/tasks/').reply(200, page([makeTask()]))
      mock.onGet('/tasks/stats/').reply(500)
      renderPage()

      expect(await screen.findByText('Could not load charts.')).toBeInTheDocument()
      mock.onGet('/tasks/stats/').reply(200, STATS)
      await user.click(screen.getByRole('button', { name: 'Retry' }))
      expect(await screen.findByRole('table', { name: 'Priority by status' })).toBeInTheDocument()
    })
  })

  describe('summary cards', () => {
    it('shows the share of tasks that are done', async () => {
      mock.onGet('/tasks/').reply(200, page([makeTask()]))
      renderPage()

      // 1 of 7 done.
      expect(await screen.findByRole('progressbar', { name: '14% done' })).toHaveAttribute('aria-valuenow', '14')
    })

    it('greets the user and counts the tasks still open', async () => {
      mock.onGet('/tasks/').reply(200, page([makeTask()]))
      renderPage()

      expect(await screen.findByText(/^Good (morning|afternoon|evening), demo$/)).toBeInTheDocument()
      // 7 total, 1 done.
      expect(screen.getByText('Open tasks: 6')).toBeInTheDocument()
    })

    it('congratulates the user when every task is done', async () => {
      mock.onGet('/tasks/summary/').reply(200, { todo: 0, in_progress: 0, done: 3, total: 3 })
      mock.onGet('/tasks/').reply(200, page([makeTask({ status: 'done' })]))
      renderPage()

      expect(await screen.findByText('All caught up. Nice work!')).toBeInTheDocument()
    })

    it('filters the list by status and toggles back off', async () => {
      const user = userEvent.setup()
      mock.onGet('/tasks/').reply(200, page([makeTask()]))
      renderPage()

      const inProgress = await screen.findByRole('button', { name: /In progress/ })
      await waitFor(() => expect(inProgress).toBeEnabled())
      await user.click(inProgress)

      expect(location()).toHaveTextContent('status=in_progress')
      await waitFor(() => expect(lastListParams()).toMatchObject({ status: 'in_progress', page: 1 }))
      expect(inProgress).toHaveAttribute('aria-pressed', 'true')

      await user.click(inProgress)
      expect(location()).not.toHaveTextContent('status=')
      expect(inProgress).toHaveAttribute('aria-pressed', 'false')
    })

    it('marks Total as active when no status filter is set', async () => {
      const user = userEvent.setup()
      mock.onGet('/tasks/').reply(200, page([makeTask({ status: 'done' })]))
      renderPage('/?status=done&page=2')

      const total = await screen.findByRole('button', { name: /Total/ })
      await waitFor(() => expect(total).toBeEnabled())
      expect(total).toHaveAttribute('aria-pressed', 'false')

      await user.click(total)
      expect(location()).not.toHaveTextContent('status=')
      expect(total).toHaveAttribute('aria-pressed', 'true')
    })
  })

  describe('empty states', () => {
    it('invites the user to create a first task', async () => {
      mock.onGet('/tasks/').reply(200, page([]))
      const { container } = renderPage()

      // Message and hint share one element, split by a <br>.
      expect(await screen.findByText(/No tasks yet/)).toHaveTextContent('Create your first task to get started.')
      expect(screen.getAllByRole('button', { name: /New task/ })).toHaveLength(2)
      await expectNoA11yViolations(container)
    })

    it('offers to clear filters when nothing matches', async () => {
      const user = userEvent.setup()
      mock
        .onGet('/tasks/')
        .reply((config) => [200, config.params?.status ? page([]) : page([makeTask()])])
      renderPage('/?status=done')

      expect(await screen.findByText('No tasks match your filters.')).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Clear filters' }))

      expect(await screen.findByText('Buy milk')).toBeInTheDocument()
      expect(location()).toHaveTextContent(/^\/$/)
      expect(lastListParams().status).toBeUndefined()
    })
  })

  describe('errors', () => {
    it('shows a retryable error when the server fails', async () => {
      const user = userEvent.setup()
      mock.onGet('/tasks/').replyOnce(500).onGet('/tasks/').reply(200, page([makeTask()]))
      renderPage()

      expect(await screen.findByText('Could not load tasks.')).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: /Retry/ }))

      expect(await screen.findByText('Buy milk')).toBeInTheDocument()
      expect(screen.queryByText('Could not load tasks.')).not.toBeInTheDocument()
    })

    it('explains a network failure', async () => {
      mock.onGet('/tasks/').networkError()
      renderPage()

      expect(await screen.findByText('Could not load tasks.')).toBeInTheDocument()
      expect(screen.getByText('Cannot reach the server. Check your connection.')).toBeInTheDocument()
    })

    it('shows an error message when a mutation fails', async () => {
      const user = userEvent.setup()
      mock.onGet('/tasks/').reply(200, page([makeTask()]))
      mock.onPatch('/tasks/1/').reply(500)
      renderPage()

      await user.click(await screen.findByRole('button', { name: 'Mark as done: Buy milk' }))

      expect(await screen.findByText('Something went wrong. Please try again.')).toBeInTheDocument()
    })
  })

  describe('mutations', () => {
    it('creates a task, confirms it, and refreshes the list', async () => {
      const user = userEvent.setup()
      mock.onGet('/tasks/').reply(200, page([makeTask()]))
      mock.onPost('/tasks/').reply(201, makeTask({ id: 2, title: 'Water plants' }))
      renderPage()
      await screen.findByText('Buy milk')
      const listCallsBefore = taskListRequests().length

      await user.click(screen.getByRole('button', { name: /New task/ }))
      const dialog = await findDialog('New task')
      await user.type(within(dialog).getByLabelText('Title'), 'Water plants')
      await user.click(within(dialog).getByRole('button', { name: 'Save' }))

      expect(await screen.findByText('Task created.')).toBeInTheDocument()
      expect(JSON.parse(mock.history.post[0].data)).toMatchObject({ title: 'Water plants', status: 'todo' })
      await waitFor(() => expect(taskListRequests().length).toBeGreaterThan(listCallsBefore))
    })

    it('edits a task with its current values prefilled', async () => {
      const user = userEvent.setup()
      mock.onGet('/tasks/').reply(200, page([makeTask({ description: 'Two litres' })]))
      mock.onPatch('/tasks/1/').reply(200, makeTask({ title: 'Buy oat milk' }))
      renderPage()

      await user.click(await screen.findByRole('button', { name: 'Edit: Buy milk' }))
      const dialog = await findDialog('Edit task')
      const title = within(dialog).getByLabelText('Title')
      expect(title).toHaveValue('Buy milk')
      expect(within(dialog).getByLabelText(/^Description/)).toHaveValue('Two litres')

      await user.clear(title)
      await user.type(title, 'Buy oat milk')
      await user.click(within(dialog).getByRole('button', { name: 'Save' }))

      expect(await screen.findByText('Task updated.')).toBeInTheDocument()
      expect(JSON.parse(mock.history.patch[0].data)).toMatchObject({ title: 'Buy oat milk' })
    })

    it('marks a task as done', async () => {
      const user = userEvent.setup()
      mock.onGet('/tasks/').reply(200, page([makeTask()]))
      mock.onPatch('/tasks/1/').reply(200, makeTask({ status: 'done' }))
      renderPage()

      await user.click(await screen.findByRole('button', { name: 'Mark as done: Buy milk' }))

      expect(await screen.findByText('Task updated.')).toBeInTheDocument()
      expect(JSON.parse(mock.history.patch[0].data)).toEqual({ status: 'done' })
    })

    it('asks for confirmation before deleting', async () => {
      const user = userEvent.setup()
      mock.onGet('/tasks/').reply(200, page([makeTask()]))
      mock.onDelete('/tasks/1/').reply(204)
      renderPage()

      await user.click(await screen.findByRole('button', { name: 'Delete: Buy milk' }))
      expect(await screen.findByText('Delete this task?')).toBeInTheDocument()
      expect(mock.history.delete).toHaveLength(0)

      await user.click(screen.getByRole('button', { name: 'Delete' }))

      expect(await screen.findByText('Task deleted.')).toBeInTheDocument()
      expect(mock.history.delete).toHaveLength(1)
    })

    it('goes back a page after deleting the last task on a page', async () => {
      const user = userEvent.setup()
      mock.onGet('/tasks/').reply(200, page([makeTask()], 11))
      mock.onDelete('/tasks/1/').reply(204)
      renderPage('/?page=2')

      await user.click(await screen.findByRole('button', { name: 'Delete: Buy milk' }))
      await user.click(await screen.findByRole('button', { name: 'Delete' }))

      await waitFor(() => expect(location()).toHaveTextContent(/^\/$/))
      await waitFor(() => expect(lastListParams()).toMatchObject({ page: 1 }))
    })
  })

  describe('search', () => {
    it('searches on Enter, syncs the URL, and resets to page 1', async () => {
      const user = userEvent.setup()
      mock.onGet('/tasks/').reply(200, page([makeTask()]))
      renderPage('/?page=3')
      await screen.findByText('Buy milk')

      await user.type(screen.getByRole('searchbox', { name: 'Search tasks…' }), 'milk{Enter}')

      await waitFor(() => expect(location()).toHaveTextContent(/^\/\?search=milk$/))
      expect(lastListParams()).toMatchObject({ search: 'milk', page: 1 })
    })
  })
})
