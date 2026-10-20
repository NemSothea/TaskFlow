import { render, screen } from '@testing-library/react'
import { type InitialEntry, MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import '../../i18n'
import { LocationProbe } from '../../test/LocationProbe'
import { AuthContext, type AuthContextValue, type AuthStatus } from './context'
import { GuestRoute, ProtectedRoute } from './RouteGuards'

function renderAt(route: InitialEntry, status: AuthStatus) {
  const value: AuthContextValue = {
    status,
    user: status === 'authenticated' ? { id: 1, username: 'a', email: 'a@x.io' } : null,
    sessionExpired: false,
    login: async () => {},
    register: async () => {},
    logout: async () => {},
  }
  return render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<p>login page</p>} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="*" element={<p>tasks page</p>} />
          </Route>
        </Routes>
        <LocationProbe />
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

describe('route guards', () => {
  it('redirects anonymous users to login', () => {
    renderAt('/', 'anonymous')
    expect(screen.getByText('login page')).toBeInTheDocument()
  })

  it('lets authenticated users through', () => {
    renderAt('/', 'authenticated')
    expect(screen.getByText('tasks page')).toBeInTheDocument()
  })

  it('sends authenticated users away from login', () => {
    renderAt('/login', 'authenticated')
    expect(screen.getByText('tasks page')).toBeInTheDocument()
  })

  it('sends a signed-in user on /login back to the page they came from', () => {
    renderAt({ pathname: '/login', state: { from: '/?status=done' } }, 'authenticated')
    expect(screen.getByRole('status', { name: 'location' })).toHaveTextContent('/?status=done')
  })

  it('ignores an off-site "from" and goes home instead', () => {
    renderAt({ pathname: '/login', state: { from: '//evil.example' } }, 'authenticated')
    expect(screen.getByRole('status', { name: 'location' })).toHaveTextContent(/^\/$/)
  })

  it('shows a spinner while the session is being restored', () => {
    renderAt('/', 'loading')
    // The spinner, not the LocationProbe (also role="status").
    expect(screen.getByRole('status', { name: (name) => name !== 'location' })).toBeInTheDocument()
    expect(screen.queryByText('tasks page')).not.toBeInTheDocument()
  })
})
