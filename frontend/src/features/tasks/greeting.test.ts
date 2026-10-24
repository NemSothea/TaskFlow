import { describe, expect, it } from 'vitest'

import { greetingKey } from './greeting'

describe('greetingKey', () => {
  it.each([
    [0, 'greetingMorning'],
    [11, 'greetingMorning'],
    [12, 'greetingAfternoon'],
    [17, 'greetingAfternoon'],
    [18, 'greetingEvening'],
    [23, 'greetingEvening'],
  ])('hour %i -> %s', (hour, key) => {
    expect(greetingKey(hour)).toBe(key)
  })
})
