import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { type InitialEntry, MemoryRouter } from 'react-router-dom'

import '../i18n'
import { PreferencesProvider } from '../preferences/PreferencesProvider'

/** `route` is a path, or `{ pathname, search, state }` to test navigation state. */
export function renderWithProviders(ui: ReactElement, { route = '/' as InitialEntry } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <PreferencesProvider>{ui}</PreferencesProvider>
    </MemoryRouter>,
  )
}
