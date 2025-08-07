import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import type { LogLevel, LogContext } from '@/lib/services/interfaces'

// Unmock the LoggerService for these tests
vi.unmock('~/lib/services/LoggerService')
vi.unmock('~/lib/di/container')
const { LoggerService } = await import('@/lib/services/LoggerService')

describe('LoggerService', () => {
  let service: LoggerService
  let consoleMethods: {
    debug: ReturnType<typeof vi.spyOn>
    log: ReturnType<typeof vi.spyOn>
    warn: ReturnType<typeof vi.spyOn>
    error: ReturnType<typeof vi.spyOn>
  }

  beforeEach(() => {
    // Skip global console mocks for LoggerService tests
    process.env.VITEST_SKIP_CONSOLE_MOCKS = 'true'
    
    // Mock console methods for testing
    consoleMethods = {
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {})
    }
    
    // Mock performance.now
    vi.spyOn(performance, 'now').mockReturnValue(1000)
    
    // Mock process.env.NODE_ENV for consistency
    process.env.NODE_ENV = 'test'
    
    service = new LoggerService('debug')
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete process.env.VITEST_SKIP_CONSOLE_MOCKS
  })

  describe('constructor', () => {
    it('should initialize with default log level', () => {
      const defaultService = new LoggerService()
      expect(defaultService.getLogLevel()).toBe('info')
    })

    it('should initialize with custom log level', () => {
      const customService = new LoggerService('warn')
      expect(customService.getLogLevel()).toBe('warn')
    })
  })

  describe('setLogLevel', () => {
    it('should set log level and log the change', () => {
      // Clear existing mocks
      Object.values(consoleMethods).forEach(mock => mock.mockClear())
      
      // Create service with 'info' level to allow the log message to show
      const infoService = new LoggerService('info')
      
      // Set to a level that won't suppress the info message
      infoService.setLogLevel('debug')
      
      expect(infoService.getLogLevel()).toBe('debug')
      expect(consoleMethods.log).toHaveBeenCalledWith(
        expect.stringMatching(/\[INFO\] Log level changed to: debug/)
      )
    })
  })

  describe('getLogLevel', () => {
    it('should return current log level', () => {
      expect(service.getLogLevel()).toBe('debug')
    })
  })

  describe('debug', () => {
    it('should log debug messages when level allows', () => {
      const context: LogContext = { module: 'test', method: 'debugTest' }
      
      service.debug('Debug message', { key: 'value' }, context)
      
      expect(consoleMethods.debug).toHaveBeenCalledWith(
        expect.stringMatching(/\[DEBUG\] \[test:debugTest\] Debug message/)
      )
    })

    it('should not log debug messages when level is too high', () => {
      service.setLogLevel('info')
      
      service.debug('Debug message')
      
      expect(consoleMethods.debug).not.toHaveBeenCalled()
    })
  })

  describe('info', () => {
    it('should log info messages', () => {
      const context: LogContext = { module: 'test' }
      
      service.info('Info message', undefined, context)
      
      expect(consoleMethods.log).toHaveBeenCalledWith(
        expect.stringMatching(/\[INFO\] \[test\] Info message/)
      )
    })

    it('should format data correctly', () => {
      service.info('Info with data', { nested: { value: 123 } })
      
      const lastCall = consoleMethods.log.mock.calls[consoleMethods.log.mock.calls.length - 1]
      expect(lastCall[0]).toContain('"nested"')
      expect(lastCall[0]).toContain('"value": 123')
    })
  })

  describe('warn', () => {
    it('should log warn messages', () => {
      service.warn('Warning message')
      
      expect(consoleMethods.warn).toHaveBeenCalledWith(
        expect.stringMatching(/\[WARN\] Warning message/)
      )
    })
  })

  describe('error', () => {
    it('should log error messages', () => {
      service.error('Error message')
      
      expect(consoleMethods.error).toHaveBeenCalledWith(
        expect.stringMatching(/\[ERROR\] Error message/)
      )
    })

    it('should format Error objects correctly', () => {
      const error = new Error('Test error')
      error.stack = 'Error stack trace'
      
      service.error('Error occurred', error)
      
      expect(consoleMethods.error).toHaveBeenCalledWith(
        expect.stringContaining('Error: Test error')
      )
      expect(consoleMethods.error).toHaveBeenCalledWith(
        expect.stringContaining('Stack: Error stack trace')
      )
    })

    it('should handle non-Error objects', () => {
      service.error('Error occurred', 'string error')
      
      expect(consoleMethods.error).toHaveBeenCalledWith(
        expect.stringContaining('string error')
      )
    })
  })

  describe('getHistory', () => {
    beforeEach(() => {
      service.debug('Debug entry')
      service.info('Info entry')
      service.warn('Warn entry')
      service.error('Error entry')
    })

    it('should return all history entries', () => {
      const history = service.getHistory()
      
      expect(history).toHaveLength(4)
      expect(history[0].message).toBe('Debug entry')
      expect(history[0].level).toBe('debug')
      expect(history[1].message).toBe('Info entry')
      expect(history[1].level).toBe('info')
    })

    it('should filter history by level', () => {
      const errorHistory = service.getHistory('error')
      
      expect(errorHistory).toHaveLength(1)
      expect(errorHistory[0].message).toBe('Error entry')
      expect(errorHistory[0].level).toBe('error')
    })

    it('should limit history results', () => {
      const limitedHistory = service.getHistory(undefined, 2)
      
      expect(limitedHistory).toHaveLength(2)
      expect(limitedHistory[0].message).toBe('Warn entry')
      expect(limitedHistory[1].message).toBe('Error entry')
    })

    it('should filter and limit history', () => {
      service.warn('Second warning')
      const filteredLimited = service.getHistory('warn', 1)
      
      expect(filteredLimited).toHaveLength(1)
      expect(filteredLimited[0].message).toBe('Second warning')
    })
  })

  describe('clearHistory', () => {
    it('should clear history and log the action', () => {
      service.debug('Test entry')
      expect(service.getHistory()).toHaveLength(1)
      
      service.clearHistory()
      
      expect(service.getHistory()).toHaveLength(1) // Only the clear message
      expect(service.getHistory()[0].message).toBe('Log history cleared')
    })
  })

  describe('time', () => {
    it('should measure and log execution time', () => {
      const endTimer = service.time('test-operation')
      
      expect(consoleMethods.debug).toHaveBeenCalledWith(
        expect.stringMatching(/Timer started: test-operation/)
      )
      
      // Simulate time passing
      vi.spyOn(performance, 'now').mockReturnValue(1500)
      endTimer()
      
      expect(consoleMethods.debug).toHaveBeenCalledWith(
        expect.stringMatching(/Timer ended: test-operation \(500\.00ms\)/)
      )
    })

    it('should use provided context', () => {
      const context: LogContext = { module: 'performance', method: 'timing' }
      const endTimer = service.time('test-with-context', context)
      
      expect(consoleMethods.debug).toHaveBeenCalledWith(
        expect.stringMatching(/\[performance:timing\]/)
      )
      
      endTimer()
      
      expect(consoleMethods.debug).toHaveBeenCalledWith(
        expect.stringMatching(/\[performance:timing\].*Timer ended/)
      )
    })
  })

  describe('logApiRequest', () => {
    it('should log API request', () => {
      service.logApiRequest('GET', '/api/test', { param: 'value' })
      
      expect(consoleMethods.log).toHaveBeenCalledWith(
        expect.stringMatching(/\[INFO\] \[api:GET\] API Request: GET \/api\/test/)
      )
    })
  })

  describe('logApiResponse', () => {
    it('should log successful API response as info', () => {
      service.logApiResponse('GET', '/api/test', 200, { result: 'success' })
      
      expect(consoleMethods.log).toHaveBeenCalledWith(
        expect.stringMatching(/\[INFO\] \[api:GET\] API Response: GET \/api\/test - 200/)
      )
    })

    it('should log error API response as error', () => {
      service.logApiResponse('POST', '/api/test', 500, { error: 'Internal error' })
      
      expect(consoleMethods.error).toHaveBeenCalledWith(
        expect.stringMatching(/\[ERROR\] \[api:POST\] API Response: POST \/api\/test - 500/)
      )
    })
  })

  describe('logWidgetEvent', () => {
    it('should log widget events', () => {
      service.logWidgetEvent(123, 'click', { button: 'left' })
      
      expect(consoleMethods.debug).toHaveBeenCalledWith(
        expect.stringMatching(/\[DEBUG\] \[widget:click\] Widget Event: click/)
      )
    })
  })

  describe('devLog', () => {
    beforeEach(() => {
      // Reset NODE_ENV
      delete process.env.NODE_ENV
    })

    it('should log in development environment', () => {
      process.env.NODE_ENV = 'development'
      const devService = new LoggerService('debug')
      
      devService.devLog('Development message', { dev: true })
      
      expect(consoleMethods.debug).toHaveBeenCalledWith(
        expect.stringMatching(/\[DEBUG\] \[dev\] \[DEV\] Development message/)
      )
    })

    it('should not log in production environment', () => {
      process.env.NODE_ENV = 'production'
      const prodService = new LoggerService('debug')
      
      prodService.devLog('Development message')
      
      expect(consoleMethods.debug).not.toHaveBeenCalledWith(
        expect.stringMatching(/\[DEV\]/)
      )
    })
  })

  describe('log level filtering', () => {
    it('should respect log level hierarchy', () => {
      service.setLogLevel('warn')
      
      service.debug('Debug message')
      service.info('Info message')
      service.warn('Warn message')
      service.error('Error message')
      
      expect(consoleMethods.debug).not.toHaveBeenCalled()
      expect(consoleMethods.log).not.toHaveBeenCalledWith(
        expect.stringMatching(/Info message/)
      )
      expect(consoleMethods.warn).toHaveBeenCalledWith(
        expect.stringMatching(/Warn message/)
      )
      expect(consoleMethods.error).toHaveBeenCalledWith(
        expect.stringMatching(/Error message/)
      )
    })
  })

  describe('history management', () => {
    it('should limit history size', () => {
      // Create a service and fill it beyond max history
      for (let i = 0; i < 1100; i++) {
        service.info(`Message ${i}`)
      }
      
      const history = service.getHistory()
      expect(history.length).toBe(1000) // Max history size
      // Should keep the most recent entries
      expect(history[history.length - 1].message).toBe('Message 1099')
    })
  })
})