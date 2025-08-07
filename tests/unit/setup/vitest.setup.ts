import { beforeAll, afterAll, afterEach, vi } from 'vitest'
import { setupDatabase, cleanupDatabase } from '../helpers/db-helper'

// Import global mocks
import '../mocks/nuxt'
import '../mocks/h3'
import '../mocks/vue'
import '../mocks/services'

// Import the mock objects to make them available
import { mockNuxtApp, mockLogger } from '../mocks/nuxt'

// Enhanced mock DOM environment
const mockElement = {
  tagName: 'DIV',
  setAttribute: vi.fn(),
  getAttribute: vi.fn(),
  hasAttribute: vi.fn(),
  removeAttribute: vi.fn(),
  style: {},
  classList: {
    add: vi.fn(),
    remove: vi.fn(),
    contains: vi.fn(),
    toggle: vi.fn()
  },
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  getBoundingClientRect: vi.fn(() => ({
    top: 0,
    left: 0,
    right: 100,
    bottom: 100,
    width: 100,
    height: 100,
    x: 0,
    y: 0
  })),
  offsetWidth: 100,
  offsetHeight: 100,
  clientWidth: 100,
  clientHeight: 100,
  parentElement: null,
  children: [],
  click: vi.fn(),
  focus: vi.fn(),
  blur: vi.fn()
}

const mockDocument = {
  body: {
    ...mockElement,
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn(),
      toggle: vi.fn()
    },
    appendChild: vi.fn(),
    removeChild: vi.fn(),
    insertBefore: vi.fn(),
    replaceChild: vi.fn()
  },
  documentElement: {
    ...mockElement,
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn(),
      toggle: vi.fn()
    }
  },
  createElement: vi.fn((tagName) => ({
    ...mockElement,
    tagName: tagName.toUpperCase()
  })),
  querySelector: vi.fn(),
  querySelectorAll: vi.fn(() => []),
  getElementById: vi.fn(),
  getElementsByTagName: vi.fn(() => []),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  createEvent: vi.fn(() => ({
    initEvent: vi.fn(),
    preventDefault: vi.fn(),
    stopPropagation: vi.fn()
  })),
  createComment: vi.fn((text) => ({
    nodeType: 8, // Node.COMMENT_NODE
    nodeValue: text || '',
    textContent: text || '',
    parentNode: null,
    nextSibling: null,
    previousSibling: null
  })),
  createTextNode: vi.fn((text) => ({
    nodeType: 3, // Node.TEXT_NODE
    nodeValue: text || '',
    textContent: text || '',
    data: text || '',
    parentNode: null,
    nextSibling: null,
    previousSibling: null
  })),
  activeElement: null,
  readyState: 'complete'
}

// Enhanced window mock with touch and mouse events
const mockTouchEvent = (type: string, touches: any[] = []) => ({
  type,
  touches,
  targetTouches: touches,
  changedTouches: touches,
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
  target: mockElement,
  currentTarget: mockElement
})

const mockMouseEvent = (type: string, options: any = {}) => ({
  type,
  clientX: options.clientX || 0,
  clientY: options.clientY || 0,
  pageX: options.pageX || 0,
  pageY: options.pageY || 0,
  button: options.button || 0,
  buttons: options.buttons || 0,
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
  target: mockElement,
  currentTarget: mockElement
})

vi.stubGlobal('window', {
  document: mockDocument,
  localStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn()
  },
  sessionStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn()
  },
  matchMedia: vi.fn(() => ({
    matches: false,
    media: '',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  })),
  // Touch event simulation
  TouchEvent: vi.fn().mockImplementation((type, options = {}) => mockTouchEvent(type, options.touches)),
  // Mouse event simulation
  MouseEvent: vi.fn().mockImplementation((type, options = {}) => mockMouseEvent(type, options)),
  Event: vi.fn().mockImplementation((type, options = {}) => ({
    type,
    ...options,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    target: mockElement,
    currentTarget: mockElement
  })),
  getComputedStyle: vi.fn(() => ({
    getPropertyValue: vi.fn(() => ''),
    setProperty: vi.fn()
  })),
  requestAnimationFrame: vi.fn((callback) => setTimeout(callback, 16)),
  cancelAnimationFrame: vi.fn((id) => clearTimeout(id)),
  setTimeout: vi.fn().mockImplementation((callback, delay) => setTimeout(callback, delay)),
  clearTimeout: vi.fn().mockImplementation((id) => clearTimeout(id)),
  innerWidth: 1024,
  innerHeight: 768,
  devicePixelRatio: 1,
  navigator: {
    userAgent: 'test',
    platform: 'test',
    maxTouchPoints: 0
  }
})

vi.stubGlobal('document', mockDocument)

// Make sure useNuxtApp is available globally with enhanced mock
vi.stubGlobal('useNuxtApp', () => mockNuxtApp)

// Make $logger available globally for composables
vi.stubGlobal('$logger', mockLogger)

// Export mock objects for tests to use
global.mockTouchEvent = mockTouchEvent
global.mockMouseEvent = mockMouseEvent
global.mockElement = mockElement
global.mockDocument = mockDocument

// Global test setup
beforeAll(async () => {
  // Initialize test database
  await setupDatabase()
  
  // Mock console methods conditionally to avoid conflicts with LoggerService tests
  if (!process.env.VITEST_SKIP_CONSOLE_MOCKS) {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  }
})

// Clean up after each test
afterEach(async () => {
  await cleanupDatabase()
  vi.clearAllMocks()
})

// Global cleanup
afterAll(async () => {
  vi.restoreAllMocks()
})