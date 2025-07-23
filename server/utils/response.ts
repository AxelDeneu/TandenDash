import { setResponseStatus, setHeader, getRequestURL, getQuery, createError, type H3Event } from 'h3'

/**
 * Response optimization utilities
 */

interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
  timestamp: string
  requestId?: string
}

interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

/**
 * Create a standardized API response
 */
export function createApiResponse<T>(
  data?: T,
  options?: {
    message?: string
    error?: string
    requestId?: string
  }
): ApiResponse<T> {
  return {
    data,
    error: options?.error,
    message: options?.message,
    timestamp: new Date().toISOString(),
    requestId: options?.requestId || generateRequestId()
  }
}

/**
 * Create a paginated API response
 */
export function createPaginatedResponse<T>(
  data: T[],
  pagination: {
    page: number
    limit: number
    total: number
  },
  options?: {
    message?: string
    requestId?: string
  }
): PaginatedResponse<T> {
  const totalPages = Math.ceil(pagination.total / pagination.limit)
  
  return {
    data,
    message: options?.message,
    timestamp: new Date().toISOString(),
    requestId: options?.requestId || generateRequestId(),
    pagination: {
      ...pagination,
      totalPages,
      hasNext: pagination.page < totalPages,
      hasPrev: pagination.page > 1
    }
  }
}

/**
 * Send response with ETag and caching
 */
export function sendCachedResponse<T>(
  event: H3Event,
  data: T,
  options?: {
    ttl?: number // Time to live in seconds
    staleWhileRevalidate?: number
    mustRevalidate?: boolean
  }
): ApiResponse<T> | T | null {
  const response = typeof data === 'object' && data !== null
    ? createApiResponse(data)
    : data

  // Set cache control if specified
  if (options?.ttl) {
    const cacheControl = [
      'public',
      `max-age=${options.ttl}`,
      options.staleWhileRevalidate ? `stale-while-revalidate=${options.staleWhileRevalidate}` : '',
      options.mustRevalidate ? 'must-revalidate' : ''
    ].filter(Boolean).join(', ')
    
    setHeader(event, 'cache-control', cacheControl)
  }

  // Set content type
  setHeader(event, 'content-type', 'application/json')

  return response
}

/**
 * Handle API errors consistently
 */
export function handleApiError(
  event: H3Event,
  error: Error | string,
  statusCode = 500,
  options?: {
    requestId?: string
    details?: Record<string, unknown>
  }
): never {
  const errorMessage = error instanceof Error ? error.message : error
  const errorDetails = error instanceof Error ? error.stack : undefined

  console.error('API Error:', {
    error: errorMessage,
    statusCode,
    url: getRequestURL(event).pathname,
    method: event.node.req.method,
    requestId: options?.requestId,
    details: options?.details,
    stack: errorDetails
  })

  const response = createApiResponse(undefined, {
    error: errorMessage,
    requestId: options?.requestId
  })

  throw createError({
    statusCode,
    statusMessage: errorMessage,
    data: response
  })
}

/**
 * Generate a simple request ID
 */
function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15)
}

/**
 * Validate and parse pagination parameters
 */
export function parsePagination(event: H3Event): {
  page: number
  limit: number
  offset: number
} {
  const query = getQuery(event)
  
  const page = Math.max(1, parseInt(query.page as string) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 20))
  const offset = (page - 1) * limit

  return { page, limit, offset }
}

/**
 * Performance monitoring for API endpoints
 */
export function withPerformanceMonitoring<T>(
  operation: () => T | Promise<T>,
  operationName: string
): T | Promise<T> {
  const start = performance.now()
  
  const finish = (result: T) => {
    const duration = performance.now() - start
    
    // Log slow operations
    if (duration > 1000) {
      console.warn(`Slow operation: ${operationName} took ${duration.toFixed(2)}ms`)
    } else if (duration > 100) {
      console.info(`Operation: ${operationName} took ${duration.toFixed(2)}ms`)
    }
    
    return result
  }

  try {
    const result = operation()
    
    if (result instanceof Promise) {
      return result.then(finish).catch((error) => {
        const duration = performance.now() - start
        console.error(`Failed operation: ${operationName} took ${duration.toFixed(2)}ms`, error)
        throw error
      })
    }
    
    return finish(result)
  } catch (error) {
    const duration = performance.now() - start
    console.error(`Failed operation: ${operationName} took ${duration.toFixed(2)}ms`, error)
    throw error
  }
}