import { describe, expect, it } from 'vitest'

import en from './locales/en'
import km from './locales/km'

function keys(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' ? keys(v as object, `${prefix}${k}.`) : [`${prefix}${k}`],
  )
}

function leaf(obj: object, path: string): string {
  return path.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown>)[k], obj) as string
}

describe('translations', () => {
  it('Khmer has exactly the English keys', () => {
    expect(keys(km).sort()).toEqual(keys(en).sort())
  })

  it('no Khmer string is empty', () => {
    for (const key of keys(km)) expect(leaf(km, key).trim(), key).not.toBe('')
  })

  it('keeps interpolation placeholders', () => {
    for (const key of keys(en)) {
      const vars = (s: string) => (s.match(/{{\w+}}/g) ?? []).sort()
      expect(vars(leaf(km, key)), key).toEqual(vars(leaf(en, key)))
    }
  })
})
