import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { useErrorHandler } from '@/composables/core/useErrorHandler'
import type { ILoggerService } from '@/lib/services/interfaces'

// Mock logger
const mockLogger: ILoggerService = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  setLogLevel: vi.fn(),
  getLogLevel: vi.fn(),
  getHistory: vi.fn(),
  clearHistory: vi.fn(),
  time: vi.fn(),
  logApiRequest: vi.fn(),
  logApiResponse: vi.fn(),
  logWidgetEvent: vi.fn(),
  devLog: vi.fn()
}

vi.mock('@/composables/core/useLogger', () => ({
  useLogger: () => mockLogger
}))

// Mock window for DOM events
const mockDispatchEvent = vi.fn()
Object.defineProperty(window, 'dispatchEvent', {
  value: mockDispatchEvent,
  writable: true
})

describe('useErrorHandler Composable', () => {
  let eventListenerSpy: typeof vi.fn

  beforeEach(() => {
    vi.clearAllMocks()
    mockDispatchEvent.mockClear()
    
    // Mock addEventListener to track event listeners
    eventListenerSpy = vi.fn()
    Object.defineProperty(window, 'addEventListener', {
      value: eventListenerSpy,
      writable: true
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const errorHandler = useErrorHandler()

      expect(errorHandler.error.value).toBeNull()
      expect(errorHandler.retryCount.value).toBe(0)
      expect(errorHandler.isRetrying.value).toBe(false)
      expect(errorHandler.maxRetries.value).toBe(3)
      expect(errorHandler.hasError.value).toBe(false)
      expect(errorHandler.canRetry.value).toBe(false)
    })

    it('should initialize with custom retry function', () => {
      const retryFn = vi.fn()
      const errorHandler = useErrorHandler(retryFn)

      expect(errorHandler.canRetry.value).toBe(false) // Still false until there's an error
    })
  })

  describe('handleError', () => {
    it('should set error and log it', async () => {
      const errorHandler = useErrorHandler()
      const testError = new Error('Test error')

      errorHandler.handleError(testError)

      expect(errorHandler.error.value).toBe(testError)
      expect(errorHandler.hasError.value).toBe(true)
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Composable error occurred',
        testError,
        {
          errorType: 'Error',
          retryCount: 0
        }
      )
    })

    it('should dispatch custom event', async () => {
      const errorHandler = useErrorHandler()
      const testError = new Error('Test error')

      errorHandler.handleError(testError)

      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'composable-error',
          detail: {
            error: testError,
            retryCount: 0
          }
        })
      )
    })

    it('should handle custom error types', async () => {
      const errorHandler = useErrorHandler()
      
      class CustomError extends Error {
        constructor(message: string) {
          super(message)
          this.name = 'CustomError'
        }
      }
      
      const customError = new CustomError('Custom error')

      errorHandler.handleError(customError)

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Composable error occurred',
        customError,
        {
          errorType: 'CustomError',
          retryCount: 0
        }
      )
    })
  })

  describe('clearError', () => {
    it('should clear error and reset retry count', async () => {
      const errorHandler = useErrorHandler()
      const testError = new Error('Test error')

      errorHandler.handleError(testError)
      expect(errorHandler.error.value).toBe(testError)
      expect(errorHandler.hasError.value).toBe(true)

      errorHandler.clearError()

      expect(errorHandler.error.value).toBeNull()
      expect(errorHandler.retryCount.value).toBe(0)
      expect(errorHandler.hasError.value).toBe(false)
    })
  })

  describe('retry functionality', () => {
    it('should not retry without retry function', async () => {
      const errorHandler = useErrorHandler()
      
      await errorHandler.retry()

      expect(mockLogger.warn).not.toHaveBeenCalled()
      expect(errorHandler.retryCount.value).toBe(0)
    })

    it('should not retry when already retrying', async () => {
      const retryFn = vi.fn().mockImplementation(() => new Promise(() => {})) // Never resolves
      const errorHandler = useErrorHandler(retryFn)

      // Start a retry operation that won't complete
      const retryPromise = errorHandler.retry()

      // Try to retry again while first is still running
      await errorHandler.retry()

      expect(retryFn).toHaveBeenCalledOnce() // Should only be called once
    })

    it('should not retry when max retries reached', async () => {
      const retryFn = vi.fn().mockRejectedValue(new Error('Always fails'))
      const errorHandler = useErrorHandler(retryFn)

      // Exhaust all retries
      await errorHandler.retry() // 1st attempt
      await errorHandler.retry() // 2nd attempt  
      await errorHandler.retry() // 3rd attempt
      await errorHandler.retry() // Should not execute

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Max retries reached',
        { retryCount: 3, maxRetries: 3 }
      )
      expect(retryFn).toHaveBeenCalledTimes(3) // Should not be called the 4th time
    })

    it('should successfully retry and clear error', async () => {
      const retryFn = vi.fn().mockResolvedValue(undefined)
      const errorHandler = useErrorHandler(retryFn)

      await errorHandler.retry()

      expect(retryFn).toHaveBeenCalled()
      expect(errorHandler.retryCount.value).toBe(0)
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Retrying operation',
        { attempt: 1, maxRetries: 3 }
      )
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Retry successful',
        { attempt: 1 }
      )
      expect(errorHandler.error.value).toBeNull()
      expect(errorHandler.isRetrying.value).toBe(false)
    })

    it('should handle retry failure', async () => {
      const retryError = new Error('Retry failed')
      const retryFn = vi.fn().mockRejectedValue(retryError)
      const errorHandler = useErrorHandler(retryFn)

      await errorHandler.retry()

      expect(errorHandler.retryCount.value).toBe(1)
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Retry failed',
        retryError,
        { attempt: 1 }
      )
      expect(errorHandler.error.value).toBe(retryError)
      expect(errorHandler.isRetrying.value).toBe(false)
    })

    it('should set retrying state during retry', async () => {
      let resolveRetry: () => void
      const retryPromise = new Promise<void>((resolve) => {
        resolveRetry = resolve
      })
      const retryFn = vi.fn().mockReturnValue(retryPromise)
      const errorHandler = useErrorHandler(retryFn)

      const retryPromiseHandler = errorHandler.retry()
      
      await nextTick()
      
      expect(errorHandler.isRetrying.value).toBe(true)
      expect(errorHandler.canRetry.value).toBe(false)

      resolveRetry!()
      await retryPromiseHandler

      expect(errorHandler.isRetrying.value).toBe(false)
    })
  })

  describe('computed properties', () => {
    describe('canRetry', () => {
      it('should be false without retry function', () => {
        const errorHandler = useErrorHandler()

        expect(errorHandler.canRetry.value).toBe(false)
      })

      it('should be true with retry function after error and no retries', () => {
        const retryFn = vi.fn()
        const errorHandler = useErrorHandler(retryFn)

        // Should be false initially
        expect(errorHandler.canRetry.value).toBe(false)
        
        // Should be true after an error occurs
        errorHandler.handleError(new Error('Test error'))
        expect(errorHandler.canRetry.value).toBe(true)
      })

      it('should be false when retrying', async () => {
        const retryFn = vi.fn().mockImplementation(() => new Promise(() => {})) // Never resolves
        const errorHandler = useErrorHandler(retryFn)

        const retryPromise = errorHandler.retry()
        
        await nextTick()
        
        expect(errorHandler.canRetry.value).toBe(false)
      })

      it('should be false when max retries reached', async () => {
        const retryFn = vi.fn().mockRejectedValue(new Error('Always fails'))
        const errorHandler = useErrorHandler(retryFn)

        // Exhaust all retries
        await errorHandler.retry()
        await errorHandler.retry()
        await errorHandler.retry()

        expect(errorHandler.canRetry.value).toBe(false)
      })
    })

    describe('hasError', () => {
      it('should be false initially', () => {
        const errorHandler = useErrorHandler()

        expect(errorHandler.hasError.value).toBe(false)
      })

      it('should be true when error is set', () => {
        const errorHandler = useErrorHandler()
        
        errorHandler.handleError(new Error('Test error'))

        expect(errorHandler.hasError.value).toBe(true)
      })

      it('should be false after clearing error', () => {
        const errorHandler = useErrorHandler()
        
        errorHandler.handleError(new Error('Test error'))
        errorHandler.clearError()

        expect(errorHandler.hasError.value).toBe(false)
      })
    })
  })

  describe('reactive properties', () => {
    it('should have error ref that reflects current error state', () => {
      const errorHandler = useErrorHandler()
      const error = new Error('Test error')

      expect(errorHandler.error.value).toBeNull()

      errorHandler.handleError(error)
      expect(errorHandler.error.value).toBe(error)

      errorHandler.clearError()
      expect(errorHandler.error.value).toBeNull()
    })

    it('should allow modifying maxRetries', () => {
      const errorHandler = useErrorHandler()

      errorHandler.maxRetries.value = 5

      expect(errorHandler.maxRetries.value).toBe(5)
    })
  })

  describe('integration scenarios', () => {
    it('should handle multiple retry attempts', async () => {
      let attempts = 0
      const retryFn = vi.fn().mockImplementation(() => {
        attempts++
        if (attempts < 3) {
          throw new Error(`Attempt ${attempts} failed`)
        }
        return Promise.resolve()
      })

      const errorHandler = useErrorHandler(retryFn)

      await errorHandler.retry() // Attempt 1 - fails
      expect(errorHandler.retryCount.value).toBe(1)
      expect(errorHandler.hasError.value).toBe(true)

      await errorHandler.retry() // Attempt 2 - fails
      expect(errorHandler.retryCount.value).toBe(2)
      expect(errorHandler.hasError.value).toBe(true)

      await errorHandler.retry() // Attempt 3 - succeeds
      expect(errorHandler.retryCount.value).toBe(0)
      expect(errorHandler.hasError.value).toBe(false)
    })

    it('should respect custom maxRetries setting', async () => {
      const retryFn = vi.fn().mockRejectedValue(new Error('Always fails'))
      const errorHandler = useErrorHandler(retryFn)

      errorHandler.maxRetries.value = 2

      await errorHandler.retry() // Attempt 1
      await errorHandler.retry() // Attempt 2
      await errorHandler.retry() // Should not execute

      expect(errorHandler.retryCount.value).toBe(2)
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Max retries reached',
        { retryCount: 2, maxRetries: 2 }
      )
    })
  })
})