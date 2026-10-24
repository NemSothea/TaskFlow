import { describe, expect, it } from 'vitest'

import { inkOn } from './colors'

describe('inkOn', () => {
  it('uses white on dark fills', () => {
    expect(inkOn('#4f46e5')).toBe('#ffffff')
  })

  it('uses ink on light fills', () => {
    expect(inkOn('#1baf7a')).toBe('#0b0b0b')
    expect(inkOn('#ffffff')).toBe('#0b0b0b')
  })
})
