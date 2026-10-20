import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type MockAdapter from 'axios-mock-adapter'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import type { Paginated, Task, TaskSummary } from '../../api/types'
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

function renderPage(route = '/') {
  return renderWithProviders(
    <>
      <TasksPage />
      <LocationProbe />
    </>,
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
})

afterEach(() => mock.restore())

describe('TasksPage', () => {
  describe('loading data', () => {
    it('shows the tasks and the summary counts', async () => {
      mock.onGet('/tasks/').reply(200, page([makeTask(), makeTask({ id: 2, title: 'Pay rent' })]))
      const { container } = renderPage()

      expect(await screen.findByText('Buy milk')).toBeInTheDocument()
      expect(screen.getByText('Pay rent')).toBeInTheDocument()
      expect(await screen.findByText('7')).toBeInTheDocument()
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
