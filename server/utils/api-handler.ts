import type { H3Event } from 'h3'
import { createError, readBody, getQuery, getRouterParam } from 'h3'
import { ServiceFactory } from '@/lib/services/ServiceFactory'
import { RepositoryFactory } from '@/lib/repositories/RepositoryFactory'
import { createApiResponse, handleApiError, withPerformanceMonitoring } from './response'
import type { IServiceFactory } from '@/lib/services/interfaces'
import type { IRepositoryFactory } from '@/lib/repositories/interfaces'

export interface ApiContext {
  services: IServiceFactory
  repositories: IRepositoryFactory
  event: H3Event
}

export interface ApiHandler<TResult = unknown> {
  (context: ApiContext): Promise<TResult>
}

export interface ApiHandlerOptions {
  rateLimit?: boolean
  cache?: {
    ttl?: number
    key?: (event: H3Event) => string
  }
}

/**
 * Create a standardized API handler with dependency injection
 */
export function defineApiHandler<TResult = unknown>(
  handler: ApiHandler<TResult>,
  options: ApiHandlerOptions = {}
): (event: H3Event) => Promise<TResult> {
  return async (event: H3Event) => {
    try {
      // Create dependency injection context
      const repositories = new RepositoryFactory()
      const services = new ServiceFactory(repositories)
      
      const context: ApiContext = {
        services,
        repositories,
        event
      }

      // Execute handler with performance monitoring
      const operationName = `${event.node.req.method} ${event.node.req.url}`
      const result = await withPerformanceMonitoring(
        () => handler(context),
        operationName
      )

      return result
    } catch (error) {
      if (error instanceof Error) {
        handleApiError(event, error, 500)
      }
      throw error
    }
  }
}

/**
 * Helper to extract and validate request body
 */
export async function getValidatedBody<T>(
  event: H3Event,
  validator: (body: unknown) => T
): Promise<T> {
  try {
    const body = await readBody(event)
    return validator(body)
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid request body',
      data: { error: error instanceof Error ? error.message : 'Validation failed' }
    })
  }
}

/**
 * Helper to extract and validate query parameters
 */
export function getValidatedQuery<T>(
  event: H3Event,
  validator: (query: unknown) => T
): T {
  try {
    const query = getQuery(event)
    return validator(query)
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid query parameters',
      data: { error: error instanceof Error ? error.message : 'Validation failed' }
    })
  }
}

/**
 * Helper to extract route parameters
 */
export function getRouteParam(
  event: H3Event,
  param: string
): string {
  const value = getRouterParam(event, param)
  if (!value) {
    throw createError({
      statusCode: 400,
      statusMessage: `Missing required parameter: ${param}`
    })
  }
  return value
}

/**
 * Helper to extract numeric route parameters
 */
export function getNumericRouteParam(
  event: H3Event,
  param: string
): number {
  const value = getRouteParam(event, param)
  const num = parseInt(value, 10)
  
  if (isNaN(num)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid numeric parameter: ${param}`
    })
  }
  
  return num
}