import { vi } from 'vitest'

/**
 * Test data generators
 */
export const testData = {
  dashboard: {
    id: 1,
    name: 'Test Dashboard',
    isDefault: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },

  dashboardSettings: {
    id: 1,
    dashboardId: 1,
    locale: 'en' as const,
    measurementSystem: 'metric' as const,
    temperatureUnit: 'celsius' as const,
    timeFormat: '24h' as const,
    dateFormat: 'DD/MM/YYYY',
    timezone: 'UTC',
    theme: 'light' as const,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },

  page: {
    id: 1,
    name: 'Test Page',
    dashboardId: 1,
    snapping: true,
    gridRows: 10,
    gridCols: 12,
    marginTop: 16,
    marginRight: 16,
    marginBottom: 16,
    marginLeft: 16,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },

  widget: {
    id: 1,
    type: 'Clock',
    position: JSON.stringify({ left: '0px', top: '0px', width: '4px', height: '3px' }),
    options: JSON.stringify({ title: 'Test Clock' }),
    pageId: 1,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },

  widgetData: {
    id: 1,
    widgetInstanceId: 1,
    key: 'testKey',
    value: JSON.stringify('testValue'),
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },

  todoList: {
    id: 1,
    name: 'Test Todo List',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },

  todoItem: {
    id: 1,
    listId: 1,
    text: 'Test Todo Item',
    completed: false,
    position: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  }
}

/**
 * Create test data variations
 */
export function createTestDashboard(overrides = {}) {
  return { ...testData.dashboard, ...overrides }
}

export function createTestDashboardSettings(overrides = {}) {
  return { ...testData.dashboardSettings, ...overrides }
}

export function createTestPage(overrides = {}) {
  return { ...testData.page, ...overrides }
}

export function createTestWidget(overrides = {}) {
  return { ...testData.widget, ...overrides }
}

export function createTestWidgetData(overrides = {}) {
  return { ...testData.widgetData, ...overrides }
}

export function createTestTodoList(overrides = {}) {
  return { ...testData.todoList, ...overrides }
}

export function createTestTodoItem(overrides = {}) {
  return { ...testData.todoItem, ...overrides }
}

/**
 * Service result helpers
 */
export function createSuccessResult<T>(data: T) {
  return { success: true, data }
}

export function createErrorResult(error: string) {
  return { success: false, error }
}

export function createSuccessListResult<T>(data: T[], total?: number) {
  return { success: true, data, total: total ?? data.length }
}

export function createErrorListResult(error: string) {
  return { success: false, error }
}

/**
 * Promise helpers for testing async code
 */
export function resolvedPromise<T>(value: T): Promise<T> {
  return Promise.resolve(value)
}

export function rejectedPromise(error: string | Error): Promise<never> {
  const err = typeof error === 'string' ? new Error(error) : error
  return Promise.reject(err)
}

/**
 * Mock timer helpers
 */
export function useMockTimers() {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })
}

/**
 * Console spy helpers
 */
export function spyOnConsole() {
  const consoleSpy = {
    log: vi.spyOn(console, 'log').mockImplementation(() => {}),
    warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
    error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    info: vi.spyOn(console, 'info').mockImplementation(() => {})
  }

  return {
    ...consoleSpy,
    restore: () => {
      Object.values(consoleSpy).forEach(spy => spy.mockRestore())
    }
  }
}

/**
 * Async test helpers
 */
export async function waitForNextTick() {
  return new Promise(resolve => process.nextTick(resolve))
}

export async function waitFor(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Error assertion helpers
 */
export function expectToThrow(fn: () => any, expectedError?: string | RegExp) {
  try {
    fn()
    throw new Error('Expected function to throw')
  } catch (error) {
    if (expectedError) {
      if (typeof expectedError === 'string') {
        expect(error.message).toBe(expectedError)
      } else {
        expect(error.message).toMatch(expectedError)
      }
    }
  }
}

export async function expectToThrowAsync(fn: () => Promise<any>, expectedError?: string | RegExp) {
  try {
    await fn()
    throw new Error('Expected async function to throw')
  } catch (error) {
    if (expectedError) {
      if (typeof expectedError === 'string') {
        expect(error.message).toBe(expectedError)
      } else {
        expect(error.message).toMatch(expectedError)
      }
    }
  }
}