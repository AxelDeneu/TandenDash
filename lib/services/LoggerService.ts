import type { ILoggerService, LogLevel, LogContext, LogEntry } from './interfaces'

export class LoggerService implements ILoggerService {
  private readonly isDevelopment: boolean
  private logLevel: LogLevel
  private readonly logHistory: LogEntry[] = []
  private readonly maxHistorySize = 1000

  constructor(level: LogLevel = 'info') {
    this.isDevelopment = process.env.NODE_ENV === 'development'
    this.logLevel = level
  }

  private readonly logLevels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  }

  private shouldLog(level: LogLevel): boolean {
    return this.logLevels[level] >= this.logLevels[this.logLevel]
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? ` [${context.module}${context.method ? `:${context.method}` : ''}]` : ''
    return `[${timestamp}] [${level.toUpperCase()}]${contextStr} ${message}`
  }

  private formatData(data: unknown): string {
    if (data === undefined) return ''
    if (data instanceof Error) {
      return `\n  Error: ${data.message}\n  Stack: ${data.stack}`
    }
    try {
      return '\n  ' + JSON.stringify(data, null, 2).split('\n').join('\n  ')
    } catch {
      return '\n  ' + String(data)
    }
  }

  private log(level: LogLevel, message: string, data?: unknown, context?: LogContext): void {
    if (!this.shouldLog(level)) return

    const formattedMessage = this.formatMessage(level, message, context)
    const formattedData = data !== undefined ? this.formatData(data) : ''
    const fullMessage = formattedMessage + formattedData

    // Store in history
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      data,
      context
    }
    this.logHistory.push(entry)
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift()
    }

    // Console output
    switch (level) {
      case 'debug':
        console.debug(fullMessage)
        break
      case 'info':
        console.log(fullMessage)
        break
      case 'warn':
        console.warn(fullMessage)
        break
      case 'error':
        console.error(fullMessage)
        break
    }
  }

  debug(message: string, data?: unknown, context?: LogContext): void {
    this.log('debug', message, data, context)
  }

  info(message: string, data?: unknown, context?: LogContext): void {
    this.log('info', message, data, context)
  }

  warn(message: string, data?: unknown, context?: LogContext): void {
    this.log('warn', message, data, context)
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    this.log('error', message, error, context)
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level
    this.info(`Log level changed to: ${level}`)
  }

  getLogLevel(): LogLevel {
    return this.logLevel
  }

  getHistory(level?: LogLevel, limit?: number): LogEntry[] {
    let filtered = this.logHistory
    
    if (level) {
      filtered = filtered.filter(entry => entry.level === level)
    }
    
    if (limit && limit > 0) {
      return filtered.slice(-limit)
    }
    
    return filtered
  }

  clearHistory(): void {
    this.logHistory.length = 0
    this.info('Log history cleared')
  }

  // Helper method for performance logging
  time(label: string, context?: LogContext): () => void {
    const start = performance.now()
    this.debug(`Timer started: ${label}`, undefined, context)
    
    return () => {
      const duration = performance.now() - start
      this.debug(`Timer ended: ${label} (${duration.toFixed(2)}ms)`, { duration }, context)
    }
  }

  // Helper method for API logging
  logApiRequest(method: string, url: string, data?: unknown): void {
    this.info(`API Request: ${method} ${url}`, data, { module: 'api', method })
  }

  logApiResponse(method: string, url: string, status: number, data?: unknown): void {
    const level = status >= 400 ? 'error' : 'info'
    this.log(level, `API Response: ${method} ${url} - ${status}`, data, { module: 'api', method })
  }

  // Helper method for widget logging
  logWidgetEvent(widgetId: number, event: string, data?: unknown): void {
    this.debug(`Widget Event: ${event}`, { widgetId, ...data }, { module: 'widget', method: event })
  }

  // Development-only detailed logging
  devLog(message: string, data?: unknown): void {
    if (this.isDevelopment) {
      this.debug(`[DEV] ${message}`, data, { module: 'dev' })
    }
  }
}