import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'

import '../i18n'
import { PreferencesProvider } from '../preferences/PreferencesProvider'

export function renderWithProviders(ui: ReactElement, { route = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <PreferencesProvider>{ui}</PreferencesProvider>
    </MemoryRouter>,
  )
}
