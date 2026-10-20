import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type MockAdapter from 'axios-mock-adapter'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { setAccessToken } from '../../api/client'
import { renderAuthApp } from '../../test/auth'
import { expectNoA11yViolations } from '../../test/axe'
import { mockApi } from '../../test/http'

let mock: MockAdapter

beforeEach(() => {
  mock = mockApi()
  mock.onPost('/auth/refresh/').reply(401)
})

afterEach(() => {
  mock.restore()
  setAccessToken(null)
})

interface RegisterFields {
  username?: string
  email?: string
  password?: string
  confirm?: string
}

async function fillForm({
  username = 'alice',
  email = 'alice@example.com',
  password = 'S3cure-pass-123',
  confirm = password,
}: RegisterFields = {}) {
  const user = userEvent.setup()
  await user.type(await screen.findByLabelText('Username'), username)
  await user.type(screen.getByLabelText('Email'), email)
  await user.type(screen.getByLabelText('Password'), password)
  await user.type(screen.getByLabelText('Confirm password'), confirm)
  await user.click(screen.getByRole('button', { name: 'Create account' }))
}

const registerCalls = () => mock.history.post.filter((r) => r.url === '/auth/register/')

describe('RegisterPage', () => {
  it('is accessible', async () => {
    const { container } = renderAuthApp('/register')
    await screen.findByLabelText('Username')
    await expectNoA11yViolations(container)
  })

  it('catches mismatched passwords before calling the API', async () => {
    renderAuthApp('/register')
    await fillForm({ confirm: 'something-else' })

    expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument()
    expect(registerCalls()).toHaveLength(0)
  })

  it('rejects an invalid email address', async () => {
    renderAuthApp('/register')
    await fillForm({ email: 'not-an-email' })

    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument()
    expect(registerCalls()).toHaveLength(0)
  })

  it('shows server validation errors next to the right field', async () => {
    mock.onPost('/auth/register/').reply(400, {
      email: ['A user with this email already exists.'],
      password: ['This password is too common.'],
    })
    renderAuthApp('/register')
    await fillForm()

    expect(await screen.findByText('A user with this email already exists.')).toBeInTheDocument()
    expect(screen.getByText('This password is too common.')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.queryByRole('alert', { name: /went wrong/ })).not.toBeInTheDocument()
  })

  it('sends the account without the confirmation field and goes to sign in', async () => {
    mock.onPost('/auth/register/').reply(201, { id: 1, username: 'alice', email: 'alice@example.com' })
    renderAuthApp('/register')
    await fillForm()

    expect(await screen.findByText('Account created. Please sign in.')).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByRole('status', { name: 'location' })).toHaveTextContent('/login'),
    )
    expect(JSON.parse(registerCalls()[0].data)).toEqual({
      username: 'alice',
      email: 'alice@example.com',
      password: 'S3cure-pass-123',
    })
  })

  it('explains rate limiting', async () => {
    mock.onPost('/auth/register/').reply(429, { detail: 'Request was throttled.' })
    renderAuthApp('/register')
    await fillForm()

    expect(await screen.findByRole('alert')).toHaveTextContent('Too many attempts.')
  })
})
