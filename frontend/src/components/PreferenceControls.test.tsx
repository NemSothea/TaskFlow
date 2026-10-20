import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useTranslation } from 'react-i18next'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import i18n from '../i18n'
import { expectNoA11yViolations } from '../test/axe'
import { renderWithProviders } from '../test/render'
import { PreferenceControls } from './PreferenceControls'

function Heading() {
  const { t } = useTranslation()
  return <h1>{t('tasks.heading')}</h1>
}

const renderControls = () =>
  renderWithProviders(
    <>
      <PreferenceControls />
      <Heading />
    </>,
  )

beforeEach(() => {
  localStorage.clear()
})

afterEach(async () => {
  await i18n.changeLanguage('en')
  localStorage.clear()
  delete document.documentElement.dataset.theme
})

describe('PreferenceControls', () => {
  it('is accessible', async () => {
    const { container } = renderControls()
    await expectNoA11yViolations(container)
  })

  it('switches the whole UI to Khmer and remembers the choice', async () => {
    const user = userEvent.setup()
    renderControls()
    expect(screen.getByRole('heading', { name: 'My tasks' })).toBeInTheDocument()

    await user.click(screen.getByText('ខ្មែរ'))

    expect(await screen.findByRole('heading', { name: 'កិច្ចការរបស់ខ្ញុំ' })).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('km')
    expect(localStorage.getItem('taskflow.language')).toBe('km')
  })

  it('toggles dark mode and remembers the choice', async () => {
    const user = userEvent.setup()
    renderControls()

    await user.click(screen.getByRole('button', { name: 'Switch to dark theme' }))

    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem('taskflow.theme')).toBe('dark')
    expect(screen.getByRole('button', { name: 'Switch to light theme' })).toBeInTheDocument()
  })
})
