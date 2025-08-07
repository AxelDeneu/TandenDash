import { vi } from 'vitest'

// Global mocks for composables that need Nuxt/Vue dependencies
export const mockLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  setLogLevel: vi.fn(),
  getLogLevel: vi.fn().mockReturnValue('info'),
  getHistory: vi.fn().mockReturnValue([]),
  clearHistory: vi.fn(),
  time: vi.fn(),
  logApiRequest: vi.fn(),
  logApiResponse: vi.fn(),
  logWidgetEvent: vi.fn(),
  devLog: vi.fn()
}

export const mockFetch = vi.fn()

export const mockNuxtApp = {
  $fetch: mockFetch,
  $logger: mockLogger
}

export const mockComposableContext = {
  events: {
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn()
  }
}

export const mockWidgetEventBus = {
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn()
}

export const mockWidgetUI = {
  startDrag: vi.fn(),
  updateDrag: vi.fn(),
  endDrag: vi.fn(),
  startResize: vi.fn(),
  updateResize: vi.fn(),
  endResize: vi.fn()
}

export const mockFloatingDock = {
  updateInteractionTime: vi.fn(),
  show: vi.fn(),
  hide: vi.fn()
}

// Setup global mocks
export function setupComposableMocks() {
  // @ts-ignore
  global.$fetch = mockFetch

  // Mock Nuxt dependencies
  vi.mock('#app', () => ({
    useNuxtApp: () => mockNuxtApp,
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      go: vi.fn(),
      back: vi.fn(),
      forward: vi.fn()
    })
  }))

  // Mock core composables
  vi.mock('@/composables/core/ComposableContext', () => ({
    useComposableContext: () => mockComposableContext
  }))

  vi.mock('@/composables/events/useWidgetEventBus', () => ({
    useWidgetEventBus: () => mockWidgetEventBus
  }))

  vi.mock('@/composables', () => ({
    useComposableContext: () => mockComposableContext,
    useLogger: () => mockLogger,
    useWidgetEventBus: () => mockWidgetEventBus,
    useWidgetUI: () => mockWidgetUI,
    useFloatingDock: () => mockFloatingDock
  }))

  vi.mock('~/lib/utils/grid', () => ({
    snapToGridWithMargins: vi.fn((x, y, w, h) => ({ x, y, w, h }))
  }))
}