import type { InitialEntry } from 'react-router-dom'
import { Route, Routes } from 'react-router-dom'

import { AuthProvider } from '../features/auth/AuthProvider'
import { LoginPage } from '../features/auth/LoginPage'
import { RegisterPage } from '../features/auth/RegisterPage'
import { LocationProbe } from './LocationProbe'
import { renderWithProviders } from './render'

/** Real AuthProvider + real auth pages, with stand-ins for the signed-in app. */
export function renderAuthApp(route: InitialEntry) {
  return renderWithProviders(
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<p>signed-in app</p>} />
      </Routes>
      <LocationProbe />
    </AuthProvider>,
    { route },
  )
}
