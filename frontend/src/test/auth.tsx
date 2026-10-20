import type { InitialEntry } from 'react-router-dom'
import { Route, Routes } from 'react-router-dom'

import { AuthProvider } from '../features/auth/AuthProvider'
import { LoginPage } from '../features/auth/LoginPage'
import { RegisterPage } from '../features/auth/RegisterPage'
import { GuestRoute, ProtectedRoute } from '../features/auth/RouteGuards'
import { LocationProbe } from './LocationProbe'
import { renderWithProviders } from './render'

/**
 * Real AuthProvider, route guards and auth pages, wired like App.tsx, with a
 * stand-in for the signed-in app. Keep the guards: they take part in redirects.
 */
export function renderAuthApp(route: InitialEntry) {
  return renderWithProviders(
    <AuthProvider>
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="*" element={<p>signed-in app</p>} />
        </Route>
      </Routes>
      <LocationProbe />
    </AuthProvider>,
    { route },
  )
}
