import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type MockAdapter from 'axios-mock-adapter'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { setAccessToken } from '../../api/client'
import { renderAuthApp } from '../../test/auth'
import { expectNoA11yViolations } from '../../test/axe'
import { mockApi } from '../../test/http'

const USER = { id: 1, username: 'alice', email: 'alice@example.com' }

let mock: MockAdapter

beforeEach(() => {
  mock = mockApi()
  // No refresh cookie: AuthProvider's session restore fails and the user is anonymous.
  mock.onPost('/auth/refresh/').reply(401)
})

afterEach(() => {
  mock.restore()
  setAccessToken(null)
})

async function fillAndSubmit(username = 'alice', password = 'S3cure-pass-123') {
  const user = userEvent.setup()
  await user.type(await screen.findByLabelText('Username'), username)
  await user.type(screen.getByLabelText('Password'), password)
  await user.click(screen.getByRole('button', { name: 'Sign in' }))
}

const location = () => screen.getByRole('status', { name: 'location' })

describe('LoginPage', () => {
  it('is accessible', async () => {
    const { container } = renderAuthApp('/login')
    await screen.findByLabelText('Username')
    await expectNoA11yViolations(container)
  })

  it('requires both fields before calling the API', async () => {
    const user = userEvent.setup()
    renderAuthApp('/login')

    await user.click(await screen.findByRole('button', { name: 'Sign in' }))

    expect(await screen.findAllByText('This field is required.')).toHaveLength(2)
    expect(mock.history.post.some((r) => r.url === '/auth/login/')).toBe(false)
  })

  it('sends the credentials and returns the user to the page they came from', async () => {
    mock.onPost('/auth/login/').reply(200, { access: 'access-token', user: USER })
    renderAuthApp({ pathname: '/login', state: { from: '/?status=done' } })

    await fillAndSubmit()

    await waitFor(() => expect(location()).toHaveTextContent('/?status=done'))
    const login = mock.history.post.find((r) => r.url === '/auth/login/')
    expect(JSON.parse(login!.data)).toEqual({ username: 'alice', password: 'S3cure-pass-123' })
  })

  it('returns a visitor to the protected page they opened before signing in', async () => {
    // Regression: GuestRoute used to redirect to "/" the moment login succeeded,
    // overriding LoginPage's redirect to state.from.
    mock.onPost('/auth/login/').reply(200, { access: 'access-token', user: USER })
    renderAuthApp('/?status=done&search=milk')

    await waitFor(() => expect(location()).toHaveTextContent(/^\/login$/))
    await fillAndSubmit()

    expect(await screen.findByText('signed-in app')).toBeInTheDocument()
    await waitFor(() => expect(location()).toHaveTextContent(/^\/\?status=done&search=milk$/))
  })

  it('never redirects to another site after login', async () => {
    mock.onPost('/auth/login/').reply(200, { access: 'access-token', user: USER })
    renderAuthApp({ pathname: '/login', state: { from: '//evil.example/phish' } })

    await fillAndSubmit()

    await waitFor(() => expect(location()).toHaveTextContent(/^\/$/))
  })

  it.each([
    [401, 'Incorrect username or password.'],
    [429, 'Too many attempts. Please wait a moment and try again.'],
    [500, 'Something went wrong. Please try again.'],
  ])('explains a %i response', async (status, message) => {
    mock.onPost('/auth/login/').reply(status, { detail: 'nope' })
    renderAuthApp('/login')

    await fillAndSubmit()

    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(location()).toHaveTextContent('/login')
  })

  it('explains a network failure', async () => {
    mock.onPost('/auth/login/').networkError()
    renderAuthApp('/login')

    await fillAndSubmit()

    expect(await screen.findByRole('alert')).toHaveTextContent('Cannot reach the server.')
  })

  it('confirms a fresh registration', async () => {
    renderAuthApp({ pathname: '/login', state: { registered: true } })
    expect(await screen.findByText('Account created. Please sign in.')).toBeInTheDocument()
  })
})
