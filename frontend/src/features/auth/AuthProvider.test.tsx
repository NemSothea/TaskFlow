import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type MockAdapter from 'axios-mock-adapter'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { api, setAccessToken } from '../../api/client'
import { mockApi } from '../../test/http'
import { AuthProvider } from './AuthProvider'
import { useAuth } from './context'

const USER = { id: 1, username: 'alice', email: 'alice@example.com' }

function Probe() {
  const { status, user, sessionExpired, logout } = useAuth()
  return (
    <div>
      <p>status: {status}</p>
      <p>user: {user?.username ?? 'none'}</p>
      <p>expired: {String(sessionExpired)}</p>
      <button onClick={() => void api.get('/tasks/').catch(() => {})}>load tasks</button>
      <button onClick={() => void logout()}>log out</button>
    </div>
  )
}

const renderProvider = () =>
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  )

let mock: MockAdapter

beforeEach(() => {
  mock = mockApi()
})

afterEach(() => {
  mock.restore()
  setAccessToken(null)
})

describe('AuthProvider', () => {
  it('starts in loading, then restores the session from the refresh cookie', async () => {
    mock.onPost('/auth/refresh/').reply(200, { access: 'access-token' })
    mock.onGet('/auth/me/').reply(200, USER)
    renderProvider()

    expect(screen.getByText('status: loading')).toBeInTheDocument()
    expect(await screen.findByText('status: authenticated')).toBeInTheDocument()
    expect(screen.getByText('user: alice')).toBeInTheDocument()
    expect(mock.history.get.find((r) => r.url === '/auth/me/')?.headers?.Authorization).toBe(
      'Bearer access-token',
    )
  })

  it('treats a missing or expired refresh cookie as signed out', async () => {
    mock.onPost('/auth/refresh/').reply(401)
    renderProvider()

    expect(await screen.findByText('status: anonymous')).toBeInTheDocument()
    expect(screen.getByText('expired: false')).toBeInTheDocument()
    expect(mock.history.get.some((r) => r.url === '/auth/me/')).toBe(false)
  })

  it('signs the user out and flags the session as expired when refresh stops working', async () => {
    const user = userEvent.setup()
    mock.onPost('/auth/refresh/').replyOnce(200, { access: 'access-token' })
    mock.onGet('/auth/me/').reply(200, USER)
    renderProvider()
    await screen.findByText('status: authenticated')

    mock.onGet('/tasks/').reply(401)
    mock.onPost('/auth/refresh/').reply(401)
    await user.click(screen.getByRole('button', { name: 'load tasks' }))

    expect(await screen.findByText('status: anonymous')).toBeInTheDocument()
    expect(screen.getByText('expired: true')).toBeInTheDocument()
    expect(screen.getByText('user: none')).toBeInTheDocument()
  })

  it('logs out on the server and forgets the access token', async () => {
    const user = userEvent.setup()
    mock.onPost('/auth/refresh/').replyOnce(200, { access: 'access-token' })
    mock.onGet('/auth/me/').reply(200, USER)
    mock.onPost('/auth/logout/').reply(204)
    renderProvider()
    await screen.findByText('status: authenticated')

    await user.click(screen.getByRole('button', { name: 'log out' }))

    expect(await screen.findByText('status: anonymous')).toBeInTheDocument()
    expect(mock.history.post.some((r) => r.url === '/auth/logout/')).toBe(true)

    mock.onGet('/tasks/').reply(200, {})
    await api.get('/tasks/')
    await waitFor(() => expect(mock.history.get.at(-1)?.headers?.Authorization).toBeUndefined())
  })
})
