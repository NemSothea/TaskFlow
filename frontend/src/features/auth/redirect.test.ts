import { describe, expect, it } from 'vitest'

import { safeRedirectTarget } from './redirect'

describe('safeRedirectTarget', () => {
  it.each([
    ['/?status=done', '/?status=done'],
    ['/tasks/5', '/tasks/5'],
    ['//evil.example/phish', '/'],
    ['https://evil.example', '/'],
    ['javascript:alert(1)', '/'],
    ['', '/'],
    [undefined, '/'],
    [42, '/'],
  ])('maps %j to %j', (from, expected) => {
    expect(safeRedirectTarget(from)).toBe(expected)
  })
})
