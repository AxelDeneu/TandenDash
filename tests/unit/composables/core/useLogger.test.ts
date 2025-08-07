import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useLogger } from '@/composables/core/useLogger'
import type { ILoggerService, LogContext } from '@/lib/services/interfaces'
import { withSetup } from '../../helpers/composable-test-utils'
import { mockLogger } from '../../mocks/nuxt'

// Set environment variable to skip console mocks for this test file
process.env.VITEST_SKIP_CONSOLE_MOCKS = 'true'

describe('useLogger Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('without default context', () => {
    it('should return the main logger', () => {
      const [logger] = withSetup(() => useLogger())
      
      expect(logger).toBe(mockLogger)
    })

    it('should delegate all calls to main logger', () => {
      const [logger] = withSetup(() => useLogger())
      
      logger.info('test message', { data: 'test' })
      
      expect(mockLogger.info).toHaveBeenCalledWith('test message', { data: 'test' })
    })
  })

  describe('with default context', () => {
    const defaultContext: LogContext = {
      module: 'TestModule',
      userId: '123'
    }

    it('should create scoped logger with default context', () => {
      const [logger] = withSetup(() => useLogger(defaultContext))
      
      expect(logger).not.toBe(mockLogger)
      expect(typeof logger.info).toBe('function')
    })

    it('should merge default context with log calls', () => {
      const [logger] = withSetup(() => useLogger(defaultContext))
      
      logger.info('test message', { data: 'test' })
      
      expect(mockLogger.info).toHaveBeenCalledWith(
        'test message', 
        { data: 'test' }, 
        defaultContext
      )
    })

    it('should merge default context with additional context', () => {
      const [logger] = withSetup(() => useLogger(defaultContext))
      const additionalContext: LogContext = { action: 'create' }
      
      logger.info('test message', { data: 'test' }, additionalContext)
      
      expect(mockLogger.info).toHaveBeenCalledWith(
        'test message',
        { data: 'test' },
        { ...defaultContext, ...additionalContext }
      )
    })

    it('should override default context with additional context', () => {
      const [logger] = withSetup(() => useLogger({ module: 'DefaultModule', userId: '123' }))
      const additionalContext: LogContext = { module: 'OverrideModule' }
      
      logger.warn('test warning', undefined, additionalContext)
      
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'test warning',
        undefined,
        { module: 'OverrideModule', userId: '123' }
      )
    })

    describe('log level methods', () => {
      it('should handle debug calls with context', () => {
        const [logger] = withSetup(() => useLogger(defaultContext))
        
        logger.debug('debug message', { debug: true })
        
        expect(mockLogger.debug).toHaveBeenCalledWith(
          'debug message',
          { debug: true },
          defaultContext
        )
      })

      it('should handle info calls with context', () => {
        const [logger] = withSetup(() => useLogger(defaultContext))
        
        logger.info('info message')
        
        expect(mockLogger.info).toHaveBeenCalledWith(
          'info message',
          undefined,
          defaultContext
        )
      })

      it('should handle warn calls with context', () => {
        const [logger] = withSetup(() => useLogger(defaultContext))
        
        logger.warn('warning message', { warning: true })
        
        expect(mockLogger.warn).toHaveBeenCalledWith(
          'warning message',
          { warning: true },
          defaultContext
        )
      })

      it('should handle error calls with context', () => {
        const [logger] = withSetup(() => useLogger(defaultContext))
        const error = new Error('Test error')
        
        logger.error('error message', error)
        
        expect(mockLogger.error).toHaveBeenCalledWith(
          'error message',
          error,
          defaultContext
        )
      })
    })

    describe('delegated methods', () => {
      it('should delegate setLogLevel calls', () => {
        const [logger] = withSetup(() => useLogger(defaultContext))
        
        logger.setLogLevel('DEBUG')
        
        expect(mockLogger.setLogLevel).toHaveBeenCalledWith('DEBUG')
      })

      it('should delegate getLogLevel calls', () => {
        const [logger] = withSetup(() => useLogger(defaultContext))
        vi.mocked(mockLogger.getLogLevel).mockReturnValue('INFO')
        
        const level = logger.getLogLevel()
        
        expect(level).toBe('INFO')
        expect(mockLogger.getLogLevel).toHaveBeenCalled()
      })

      it('should delegate getHistory calls', () => {
        const [logger] = withSetup(() => useLogger(defaultContext))
        const mockHistory = [{ message: 'test', level: 'INFO', timestamp: new Date() }]
        vi.mocked(mockLogger.getHistory).mockReturnValue(mockHistory)
        
        const history = logger.getHistory()
        
        expect(history).toBe(mockHistory)
        expect(mockLogger.getHistory).toHaveBeenCalled()
      })

      it('should delegate clearHistory calls', () => {
        const [logger] = withSetup(() => useLogger(defaultContext))
        
        logger.clearHistory()
        
        expect(mockLogger.clearHistory).toHaveBeenCalled()
      })

      it('should delegate time calls with context', () => {
        const [logger] = withSetup(() => useLogger(defaultContext))
        
        logger.time('test-timer')
        
        expect(mockLogger.time).toHaveBeenCalledWith('test-timer', defaultContext)
      })

      it('should delegate time calls with merged context', () => {
        const [logger] = withSetup(() => useLogger(defaultContext))
        const additionalContext: LogContext = { operation: 'benchmark' }
        
        logger.time('test-timer', additionalContext)
        
        expect(mockLogger.time).toHaveBeenCalledWith(
          'test-timer',
          { ...defaultContext, ...additionalContext }
        )
      })

      it('should delegate logApiRequest calls', () => {
        const [logger] = withSetup(() => useLogger(defaultContext))
        
        logger.logApiRequest('GET', '/api/test', { data: 'test' })
        
        expect(mockLogger.logApiRequest).toHaveBeenCalledWith('GET', '/api/test', { data: 'test' })
      })

      it('should delegate logApiResponse calls', () => {
        const [logger] = withSetup(() => useLogger(defaultContext))
        
        logger.logApiResponse('GET', '/api/test', 200, { result: 'success' })
        
        expect(mockLogger.logApiResponse).toHaveBeenCalledWith('GET', '/api/test', 200, { result: 'success' })
      })

      it('should delegate logWidgetEvent calls', () => {
        const [logger] = withSetup(() => useLogger(defaultContext))
        
        logger.logWidgetEvent('widget-created', 'Clock', { position: { x: 10, y: 10 } })
        
        expect(mockLogger.logWidgetEvent).toHaveBeenCalledWith('widget-created', 'Clock', { position: { x: 10, y: 10 } })
      })

      it('should delegate devLog calls', () => {
        const [logger] = withSetup(() => useLogger(defaultContext))
        
        logger.devLog('Development message', { dev: true })
        
        expect(mockLogger.devLog).toHaveBeenCalledWith('Development message', { dev: true })
      })
    })
  })

  describe('context handling edge cases', () => {
    it('should handle empty default context', () => {
      const [logger] = withSetup(() => useLogger({}))
      
      logger.info('test message')
      
      expect(mockLogger.info).toHaveBeenCalledWith('test message', undefined, {})
    })

    it('should handle undefined additional context', () => {
      const [logger] = withSetup(() => useLogger({ module: 'Test' }))
      
      logger.error('error message', new Error('test'), undefined)
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'error message',
        expect.any(Error),
        { module: 'Test' }
      )
    })

    it('should handle nested context objects', () => {
      const [logger] = withSetup(() => useLogger({ 
        module: 'Test',
        meta: { version: '1.0.0' }
      }))
      
      logger.info('test message', undefined, { 
        meta: { build: '123' } 
      })
      
      expect(mockLogger.info).toHaveBeenCalledWith(
        'test message',
        undefined,
        {
          module: 'Test',
          meta: { build: '123' } // Additional context overrides default
        }
      )
    })
  })
})