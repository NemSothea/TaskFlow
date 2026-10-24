import '@testing-library/jest-dom/vitest'

import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => cleanup())

// jsdom lacks these browser APIs that Ant Design relies on.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    // Reduced motion on: animated values (count-ups, rings) render their final state at once.
    matches: query.includes('prefers-reduced-motion'),
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver

// Node 25+ defines its own `localStorage` global, which shadows jsdom's and has no
// methods unless Node runs with --localstorage-file. Use an in-memory Storage instead.
if (typeof window.localStorage?.clear !== 'function') {
  class MemoryStorage implements Storage {
    #items = new Map<string, string>()
    get length() {
      return this.#items.size
    }
    clear() {
      this.#items.clear()
    }
    getItem(key: string) {
      return this.#items.get(key) ?? null
    }
    key(index: number) {
      return [...this.#items.keys()][index] ?? null
    }
    removeItem(key: string) {
      this.#items.delete(key)
    }
    setItem(key: string, value: string) {
      this.#items.set(key, String(value))
    }
  }
  for (const name of ['localStorage', 'sessionStorage'] as const) {
    Object.defineProperty(window, name, { configurable: true, value: new MemoryStorage() })
  }
}
