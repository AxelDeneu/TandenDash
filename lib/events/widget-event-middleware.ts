import type { WidgetEvents } from './widget-events'

export interface EventMiddleware {
  name: string
  handler: (event: keyof WidgetEvents, args: unknown[]) => boolean
}

/**
 * Logging middleware for development
 */
export const loggingMiddleware: EventMiddleware = {
  name: 'logging',
  handler: (event, args) => {
    if (process.dev) {
      console.log(`[Event] ${String(event)}`, ...args)
    }
    return true
  }
}

/**
 * Performance monitoring middleware
 */
export const performanceMiddleware: EventMiddleware = {
  name: 'performance',
  handler: (event, args) => {
    if (process.dev) {
      performance.mark(`event-${String(event)}-start`)
    }
    return true
  }
}

/**
 * Event validation middleware
 */
export const validationMiddleware: EventMiddleware = {
  name: 'validation',
  handler: (event, args) => {
    // Validate widget IDs are positive integers
    if (event.toString().startsWith('widget:') && args.length > 0) {
      const widgetId = args[0]
      if (typeof widgetId === 'number' && (!Number.isInteger(widgetId) || widgetId <= 0)) {
        console.error(`Invalid widget ID: ${widgetId}`)
        return false
      }
    }
    
    // Validate page IDs
    if (event.toString().startsWith('page:') && args.length > 0) {
      const pageId = args[0]
      if (typeof pageId === 'number' && (!Number.isInteger(pageId) || pageId <= 0)) {
        console.error(`Invalid page ID: ${pageId}`)
        return false
      }
    }
    
    return true
  }
}

/**
 * Rate limiting middleware to prevent event spam
 */
export const rateLimitMiddleware: EventMiddleware = {
  name: 'rateLimit',
  handler: (() => {
    const eventCounts = new Map<string, { count: number; resetTime: number }>()
    const MAX_EVENTS_PER_SECOND = 100
    
    return (event, args) => {
      const now = Date.now()
      const key = String(event)
      const entry = eventCounts.get(key)
      
      if (!entry || now > entry.resetTime) {
        eventCounts.set(key, { count: 1, resetTime: now + 1000 })
        return true
      }
      
      if (entry.count >= MAX_EVENTS_PER_SECOND) {
        console.warn(`Rate limit exceeded for event: ${key}`)
        return false
      }
      
      entry.count++
      return true
    }
  })()
}

/**
 * Error boundary middleware
 */
export const errorBoundaryMiddleware: EventMiddleware = {
  name: 'errorBoundary',
  handler: (event, args) => {
    try {
      // Check for error events and validate error objects
      if (event === 'widget:error' && args.length >= 2) {
        const error = args[1]
        if (!(error instanceof Error)) {
          console.error('widget:error event must include an Error object')
          return false
        }
      }
      return true
    } catch (err) {
      console.error('Error in event middleware:', err)
      return false
    }
  }
}

/**
 * Get all default middleware
 */
export function getDefaultMiddleware(): EventMiddleware[] {
  const middleware: EventMiddleware[] = []
  
  if (process.dev) {
    middleware.push(loggingMiddleware)
    middleware.push(performanceMiddleware)
  }
  
  middleware.push(validationMiddleware)
  middleware.push(rateLimitMiddleware)
  middleware.push(errorBoundaryMiddleware)
  
  return middleware
}