import { vi } from 'vitest'

// Create logger mock here to avoid circular dependencies
const mockLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  setLogLevel: vi.fn(),
  getLogLevel: vi.fn(() => 'info'),
  getHistory: vi.fn(() => []),
  clearHistory: vi.fn(),
  time: vi.fn(),
  logApiRequest: vi.fn(),
  logApiResponse: vi.fn(),
  logWidgetEvent: vi.fn(),
  devLog: vi.fn()
}

// Mock useNuxtApp
export const mockNuxtApp = {
  $router: {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    currentRoute: {
      value: {
        path: '/',
        params: {},
        query: {},
        meta: {}
      }
    }
  },
  $route: {
    path: '/',
    params: {},
    query: {},
    meta: {}
  },
  $i18n: {
    locale: { value: 'en' },
    t: vi.fn((key: string) => key),
    setLocale: vi.fn()
  },
  $logger: mockLogger,
  ssrContext: null,
  payload: {},
  runWithContext: vi.fn((fn) => fn()),
  provide: vi.fn(),
  hook: vi.fn()
}

export { mockLogger }

// Mock useRouter
export const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  currentRoute: {
    value: {
      path: '/',
      params: {},
      query: {},
      meta: {}
    }
  }
}

// Mock useRoute  
export const mockRoute = {
  path: '/',
  params: {},
  query: {},
  meta: {}
}

// Global mocks for Nuxt composables
vi.mock('#app', () => ({
  useNuxtApp: () => mockNuxtApp,
  useRouter: () => mockRouter,
  useRoute: () => mockRoute,
  navigateTo: vi.fn(),
  createError: vi.fn(),
  showError: vi.fn()
}))

vi.mock('vue-router', () => ({
  useRouter: () => mockRouter,
  useRoute: () => mockRoute
}))

vi.mock('#imports', () => ({
  useNuxtApp: () => mockNuxtApp,
  useRouter: () => mockRouter,
  useRoute: () => mockRoute,
  navigateTo: vi.fn(),
  ref: vi.fn(),
  reactive: vi.fn(),
  computed: vi.fn(),
  watch: vi.fn(),
  onMounted: vi.fn(),
  onUnmounted: vi.fn(),
  nextTick: vi.fn()
}))

// Mock useNuxtApp globally for direct import
vi.stubGlobal('useNuxtApp', () => mockNuxtApp)

// Mock process with all necessary properties
vi.stubGlobal('process', {
  ...process,
  client: true,
  server: false,
  env: {
    ...process.env,
    NODE_ENV: 'test'
  },
  on: vi.fn(),
  off: vi.fn(),
  exit: vi.fn()
})