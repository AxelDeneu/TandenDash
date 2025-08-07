import { vi } from 'vitest'
import { mockLogger } from './nuxt'

// Mock DI Container access to logger
vi.mock('~/lib/di/container', () => ({
  container: {
    getInstance: vi.fn((name: string) => {
      if (name === 'LoggerService') {
        return mockLogger
      }
      return null
    })
  }
}))

// Mock the logger service directly
vi.mock('~/lib/services/LoggerService', () => ({
  LoggerService: vi.fn(() => mockLogger)
}))

// Export mock for use in tests
export { mockLogger as default }