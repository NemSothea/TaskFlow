import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../test/render'
import { TaskFormModal } from './TaskFormModal'

describe('TaskFormModal', () => {
  it('validates the title before submitting', async () => {
    const onSubmit = vi.fn()
    renderWithProviders(<TaskFormModal open task={null} onCancel={() => {}} onSubmit={onSubmit} />)

    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('This field is required.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits trimmed values with defaults', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    renderWithProviders(<TaskFormModal open task={null} onCancel={() => {}} onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText('Title'), '  Buy milk  ')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        title: 'Buy milk',
        description: '',
        status: 'todo',
        priority: 'medium',
        due_date: null,
      }),
    )
  })
})
