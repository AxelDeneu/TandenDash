import { vi } from 'vitest'

// Mock H3 utilities
export const mockEvent = {
  node: {
    req: {
      method: 'GET',
      url: '/',
      headers: {}
    },
    res: {
      statusCode: 200,
      headers: {},
      end: vi.fn(),
      write: vi.fn(),
      writeHead: vi.fn()
    }
  },
  context: {},
  handled: false
}

// Mock h3 functions
vi.mock('h3', () => ({
  createError: vi.fn((options) => {
    const error = new Error(options.statusMessage || 'Error')
    ;(error as any).statusCode = options.statusCode || 500
    ;(error as any).statusMessage = options.statusMessage || 'Error'
    ;(error as any).data = options.data
    return error
  }),
  getQuery: vi.fn(() => ({})),
  readBody: vi.fn(() => Promise.resolve({})),
  getRouterParam: vi.fn(() => undefined),
  setResponseHeader: vi.fn(),
  setResponseStatus: vi.fn(),
  send: vi.fn(),
  getRequestURL: vi.fn(() => ({ pathname: '/' })),
  defineEventHandler: vi.fn((handler) => handler),
  eventHandler: vi.fn((handler) => handler),
  isMethod: vi.fn(() => false),
  assertMethod: vi.fn(),
  getMethod: vi.fn(() => 'GET')
}))

// Mock Nitro utilities
vi.mock('nitropack/runtime', () => ({
  useStorage: vi.fn(() => ({
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    getKeys: vi.fn(() => [])
  })),
  useNitroApp: vi.fn(() => ({
    hooks: {
      hook: vi.fn(),
      callHook: vi.fn()
    }
  }))
}))