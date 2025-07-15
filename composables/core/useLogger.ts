import type { ILoggerService, LogContext } from '@/lib/services/interfaces'

/**
 * Composable for structured logging throughout the application
 */
export function useLogger(defaultContext?: LogContext) {
  const { $logger } = useNuxtApp()
  
  // Create a scoped logger with default context
  const createScopedLogger = (context: LogContext): ILoggerService => {
    const mergedContext = { ...defaultContext, ...context }
    
    return {
      debug: (message: string, data?: unknown, additionalContext?: LogContext) => 
        $logger.debug(message, data, { ...mergedContext, ...additionalContext }),
      
      info: (message: string, data?: unknown, additionalContext?: LogContext) => 
        $logger.info(message, data, { ...mergedContext, ...additionalContext }),
      
      warn: (message: string, data?: unknown, additionalContext?: LogContext) => 
        $logger.warn(message, data, { ...mergedContext, ...additionalContext }),
      
      error: (message: string, error?: Error | unknown, additionalContext?: LogContext) => 
        $logger.error(message, error, { ...mergedContext, ...additionalContext }),
      
      // Delegate other methods to the main logger
      setLogLevel: $logger.setLogLevel.bind($logger),
      getLogLevel: $logger.getLogLevel.bind($logger),
      getHistory: $logger.getHistory.bind($logger),
      clearHistory: $logger.clearHistory.bind($logger),
      time: (label: string, additionalContext?: LogContext) => 
        $logger.time(label, { ...mergedContext, ...additionalContext }),
      logApiRequest: $logger.logApiRequest.bind($logger),
      logApiResponse: $logger.logApiResponse.bind($logger),
      logWidgetEvent: $logger.logWidgetEvent.bind($logger),
      devLog: $logger.devLog.bind($logger)
    }
  }
  
  // If default context is provided, return scoped logger
  if (defaultContext) {
    return createScopedLogger(defaultContext)
  }
  
  // Otherwise return the main logger
  return $logger
}