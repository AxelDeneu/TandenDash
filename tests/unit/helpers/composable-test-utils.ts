import { ref, nextTick, getCurrentInstance } from 'vue'
import { vi, type MockedFunction } from 'vitest'
import { mockNuxtApp, mockLogger } from '../mocks/nuxt'
import type { ILoggerService } from '@/lib/services/interfaces'

/**
 * Wrapper to execute composables within Vue reactivity context
 * Provides basic reactivity context without complex lifecycle handling
 */
export function withSetup<T>(composable: () => T): [T, () => void] {
  let result: T
  let scope: any
  
  // Import Vue functions dynamically to avoid issues
  const { effectScope } = require('vue')
  
  // Create effect scope to manage reactivity
  scope = effectScope()
  
  // Run the composable within the scope
  result = scope.run(() => composable())
  
  const cleanup = () => {
    if (scope) {
      scope.stop()
      scope = null
    }
  }
  
  return [result, cleanup]
}

/**
 * Enhanced Nuxt app mock with better type support
 */
export function mockNuxtApp(overrides: any = {}) {
  return {
    ...mockNuxtApp,
    ...overrides,
    $logger: overrides.$logger || mockLogger
  }
}

/**
 * Create touch event for testing touch interactions
 */
export function mockTouchEvents() {
  const createTouchEvent = (type: string, touches: Touch[] = [], options: any = {}) => {
    const touch = {
      identifier: 0,
      target: global.mockElement,
      clientX: options.clientX || 0,
      clientY: options.clientY || 0,
      pageX: options.pageX || 0,
      pageY: options.pageY || 0,
      screenX: options.screenX || 0,
      screenY: options.screenY || 0,
      radiusX: 5,
      radiusY: 5,
      rotationAngle: 0,
      force: 1
    } as Touch

    const touchList = touches.length > 0 ? touches : [touch]
    
    return new (global as any).TouchEvent(type, {
      touches: touchList,
      targetTouches: touchList,
      changedTouches: touchList,
      bubbles: true,
      cancelable: true,
      ...options
    })
  }

  return {
    touchstart: (options?: any) => createTouchEvent('touchstart', [], options),
    touchmove: (options?: any) => createTouchEvent('touchmove', [], options),
    touchend: (options?: any) => createTouchEvent('touchend', [], options),
    touchcancel: (options?: any) => createTouchEvent('touchcancel', [], options)
  }
}

/**
 * Create mouse events for testing mouse interactions
 */
export function mockMouseEvents() {
  const createMouseEvent = (type: string, options: any = {}) => {
    return new (global as any).MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      clientX: options.clientX || 0,
      clientY: options.clientY || 0,
      pageX: options.pageX || 0,
      pageY: options.pageY || 0,
      button: options.button || 0,
      buttons: options.buttons || 0,
      ...options
    })
  }

  return {
    mousedown: (options?: any) => createMouseEvent('mousedown', options),
    mousemove: (options?: any) => createMouseEvent('mousemove', options),
    mouseup: (options?: any) => createMouseEvent('mouseup', options),
    click: (options?: any) => createMouseEvent('click', options),
    dblclick: (options?: any) => createMouseEvent('dblclick', options),
    contextmenu: (options?: any) => createMouseEvent('contextmenu', options),
    wheel: (options?: any) => createMouseEvent('wheel', options)
  }
}

/**
 * Simulate DOM element interaction
 */
export function simulateElementInteraction(element: any, eventType: string, options: any = {}) {
  const event = element.dispatchEvent ? 
    (global as any).mockMouseEvent(eventType, options) :
    new (global as any).Event(eventType, options)
  
  if (element.dispatchEvent) {
    element.dispatchEvent(event)
  }
  
  return event
}

/**
 * Wait for Vue reactivity to settle
 */
export async function waitForReactivity(ticks: number = 1) {
  for (let i = 0; i < ticks; i++) {
    await nextTick()
  }
}

/**
 * Reset all mocks in the composable context
 */
export function resetComposableMocks() {
  vi.clearAllMocks()
  
  // Reset mock states
  if (global.mockDocument) {
    vi.clearAllMocks()
    Object.values(global.mockDocument.body.classList).forEach(fn => {
      if (vi.isMockFunction(fn)) {
        (fn as MockedFunction<any>).mockClear()
      }
    })
  }
}

/**
 * Create a test context for composables with proper cleanup
 */
export function createComposableTestContext() {
  let app: App | null = null
  
  const cleanup = () => {
    if (app) {
      app.unmount()
      app = null
    }
    resetComposableMocks()
  }
  
  const withSetupAndCleanup = <T>(composable: () => T): T => {
    const [result, appInstance] = withSetup(composable)
    app = appInstance
    return result
  }
  
  return {
    withSetup: withSetupAndCleanup,
    cleanup,
    mockTouchEvents: mockTouchEvents(),
    mockMouseEvents: mockMouseEvents(),
    waitForReactivity,
    resetMocks: resetComposableMocks
  }
}

/**
 * Test helper for readonly ref behavior
 */
export function expectReadonlyRef(ref: any) {
  const originalValue = ref.value
  let errorThrown = false
  
  try {
    ref.value = !originalValue
  } catch (error) {
    errorThrown = true
  }
  
  // Vue 3's readonly() doesn't throw in all environments, 
  // so we check if the value changed instead
  const valueChanged = ref.value !== originalValue
  return !valueChanged || errorThrown
}

/**
 * Create mock logger with tracking
 */
export function createMockLogger(): ILoggerService & { getCalls(): any[] } {
  const calls: any[] = []
  
  const trackCall = (method: string, ...args: any[]) => {
    calls.push({ method, args })
  }
  
  return {
    debug: vi.fn((...args) => trackCall('debug', ...args)),
    info: vi.fn((...args) => trackCall('info', ...args)),
    warn: vi.fn((...args) => trackCall('warn', ...args)),
    error: vi.fn((...args) => trackCall('error', ...args)),
    setLogLevel: vi.fn((...args) => trackCall('setLogLevel', ...args)),
    getLogLevel: vi.fn(() => 'INFO'),
    getHistory: vi.fn(() => [{ message: 'test', level: 'INFO', timestamp: new Date() }]),
    clearHistory: vi.fn((...args) => trackCall('clearHistory', ...args)),
    time: vi.fn((...args) => trackCall('time', ...args)),
    logApiRequest: vi.fn((...args) => trackCall('logApiRequest', ...args)),
    logApiResponse: vi.fn((...args) => trackCall('logApiResponse', ...args)),
    logWidgetEvent: vi.fn((...args) => trackCall('logWidgetEvent', ...args)),
    devLog: vi.fn((...args) => trackCall('devLog', ...args)),
    getCalls: () => calls
  } as any
}

declare global {
  var mockTouchEvent: (type: string, touches?: any[]) => any
  var mockMouseEvent: (type: string, options?: any) => any
  var mockElement: any
  var mockDocument: any
}