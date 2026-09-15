import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// jsdom has no IntersectionObserver / matchMedia / ResizeObserver — the motion components use
// them. Stub the minimum so a render doesn't throw.
class NoopObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}

const g = globalThis as unknown as Record<string, unknown>
g.IntersectionObserver ??= NoopObserver
g.ResizeObserver ??= NoopObserver

if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}

afterEach(() => cleanup())
