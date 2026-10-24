import { describe, expect, it } from 'vitest'

import { niceCeil, parseLocalDate, percentOf } from './scale'

describe('niceCeil', () => {
  it.each([
    [0, 1],
    [1, 1],
    [3, 5],
    [7, 10],
    [10, 10],
    [13, 20],
    [48, 50],
    [51, 100],
    [120, 200],
  ])('%i -> %i', (value, expected) => {
    expect(niceCeil(value)).toBe(expected)
  })
})

describe('percentOf', () => {
  it('rounds to a whole percentage', () => {
    expect(percentOf(1, 3)).toBe(33)
  })

  it('is 0 when the total is 0', () => {
    expect(percentOf(0, 0)).toBe(0)
  })
})

describe('parseLocalDate', () => {
  it('keeps the calendar day in every time zone', () => {
    const date = parseLocalDate('2026-10-19')
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 9, 19])
  })
})
