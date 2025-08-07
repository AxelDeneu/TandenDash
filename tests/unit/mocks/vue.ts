import { vi } from 'vitest'

// Don't mock Vue core - let it work naturally in tests
// Only mock SSR context that might not exist
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    useSSRContext: vi.fn(() => undefined)
  }
})

// Mock VueUse
vi.mock('@vueuse/core', () => ({
  useLocalStorage: vi.fn((key, defaultValue) => ({ value: defaultValue })),
  useColorMode: vi.fn(() => ({ 
    value: 'light',
    preference: 'auto',
    system: 'light'
  })),
  useDark: vi.fn(() => ({ value: false })),
  useToggle: vi.fn(() => [{ value: false }, vi.fn()]),
  useClipboard: vi.fn(() => ({
    copy: vi.fn(),
    copied: { value: false },
    isSupported: { value: true }
  })),
  useEventListener: vi.fn(),
  useMutationObserver: vi.fn(),
  useResizeObserver: vi.fn(),
  useIntersectionObserver: vi.fn(),
  useElementBounding: vi.fn(() => ({
    x: { value: 0 },
    y: { value: 0 },
    width: { value: 100 },
    height: { value: 100 },
    top: { value: 0 },
    right: { value: 100 },
    bottom: { value: 100 },
    left: { value: 0 }
  }))
}))

// Mock Pinia
vi.mock('pinia', () => ({
  defineStore: vi.fn(() => vi.fn()),
  createPinia: vi.fn(),
  setActivePinia: vi.fn()
}))

// Mock GSAP
vi.mock('gsap', () => ({
  default: {
    to: vi.fn(() => ({ kill: vi.fn() })),
    from: vi.fn(() => ({ kill: vi.fn() })),
    set: vi.fn(),
    timeline: vi.fn(() => ({
      to: vi.fn(),
      from: vi.fn(),
      set: vi.fn(),
      kill: vi.fn()
    })),
    killTweensOf: vi.fn()
  }
}))