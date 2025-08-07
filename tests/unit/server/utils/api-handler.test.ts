import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createError, readBody, getQuery, getRouterParam } from 'h3'
import {
  defineApiHandler,
  getValidatedBody,
  getValidatedQuery,
  getRouteParam,
  getNumericRouteParam,
  type ApiContext
} from '@/server/utils/api-handler'
import { ServiceFactory } from '@/lib/services/ServiceFactory'
import { RepositoryFactory } from '@/lib/repositories/RepositoryFactory'

// Mock dependencies
vi.mock('h3', async () => {
  const actual = await vi.importActual('h3')
  return {
    ...actual,
    createError: vi.fn().mockImplementation((options) => {
      const error = new Error(options.statusMessage || 'Error')
      error.statusCode = options.statusCode
      error.data = options.data
      throw error
    }),
    readBody: vi.fn(),
    getQuery: vi.fn(),
    getRouterParam: vi.fn()
  }
})

vi.mock('@/lib/services/ServiceFactory')
vi.mock('@/lib/repositories/RepositoryFactory')
vi.mock('@/server/utils/response', () => ({
  createApiResponse: vi.fn(),
  handleApiError: vi.fn(),
  withPerformanceMonitoring: vi.fn((fn) => fn())
}))

describe('API Handler Utils', () => {
  let mockEvent: any
  let mockServices: any
  let mockRepositories: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockEvent = {
      node: {
        req: {
          method: 'GET',
          url: '/test'
        }
      }
    }

    mockServices = {}
    mockRepositories = {}

    vi.mocked(ServiceFactory).mockImplementation(() => mockServices as any)
    vi.mocked(RepositoryFactory).mockImplementation(() => mockRepositories as any)
  })

  describe('defineApiHandler', () => {
    it('should create handler with dependency injection context', async () => {
      const mockHandler = vi.fn().mockResolvedValue({ success: true })
      
      const handler = defineApiHandler(mockHandler)
      const result = await handler(mockEvent)

      expect(mockHandler).toHaveBeenCalledWith({
        services: mockServices,
        repositories: mockRepositories,
        event: mockEvent
      })
      expect(result).toEqual({ success: true })
    })

    it('should handle errors in handler', async () => {
      const mockError = new Error('Test error')
      const mockHandler = vi.fn().mockRejectedValue(mockError)
      
      const handler = defineApiHandler(mockHandler)

      await expect(handler(mockEvent)).rejects.toThrow(mockError)
    })

    it('should call performance monitoring', async () => {
      const mockHandler = vi.fn().mockResolvedValue({ success: true })
      const { withPerformanceMonitoring } = await import('@/server/utils/response')
      
      const handler = defineApiHandler(mockHandler)
      await handler(mockEvent)

      expect(withPerformanceMonitoring).toHaveBeenCalledWith(
        expect.any(Function),
        'GET /test'
      )
    })

    it('should pass through context correctly', async () => {
      let capturedContext: ApiContext
      const mockHandler = vi.fn().mockImplementation((ctx) => {
        capturedContext = ctx
        return Promise.resolve({ success: true })
      })
      
      const handler = defineApiHandler(mockHandler)
      await handler(mockEvent)

      expect(capturedContext!.services).toBe(mockServices)
      expect(capturedContext!.repositories).toBe(mockRepositories)
      expect(capturedContext!.event).toBe(mockEvent)
    })
  })

  describe('getValidatedBody', () => {
    const mockCreateError = vi.mocked(createError)

    it('should validate and return body successfully', async () => {
      const mockBody = { name: 'test', age: 25 }
      const mockValidator = vi.fn().mockReturnValue(mockBody)
      vi.mocked(readBody).mockResolvedValue(mockBody)

      const result = await getValidatedBody(mockEvent, mockValidator)

      expect(vi.mocked(readBody)).toHaveBeenCalledWith(mockEvent)
      expect(mockValidator).toHaveBeenCalledWith(mockBody)
      expect(result).toEqual(mockBody)
    })

    it('should throw error when validation fails', async () => {
      const mockBody = { invalid: 'data' }
      const validationError = new Error('Validation failed')
      const mockValidator = vi.fn().mockImplementation(() => {
        throw validationError
      })
      vi.mocked(readBody).mockResolvedValue(mockBody)

      await expect(getValidatedBody(mockEvent, mockValidator)).rejects.toThrow('Invalid request body')

      expect(mockCreateError).toHaveBeenCalledWith({
        statusCode: 400,
        statusMessage: 'Invalid request body',
        data: { error: 'Validation failed' }
      })
    })

    it('should handle non-Error validation failures', async () => {
      const mockBody = { invalid: 'data' }
      const mockValidator = vi.fn().mockImplementation(() => {
        throw 'String error'
      })
      vi.mocked(readBody).mockResolvedValue(mockBody)

      await expect(getValidatedBody(mockEvent, mockValidator)).rejects.toThrow('Invalid request body')

      expect(mockCreateError).toHaveBeenCalledWith({
        statusCode: 400,
        statusMessage: 'Invalid request body',
        data: { error: 'Validation failed' }
      })
    })
  })

  describe('getValidatedQuery', async () => {
    const { getQuery } = await import('h3')
    const mockCreateError = vi.mocked(createError)

    it('should validate and return query successfully', () => {
      const mockQuery = { page: '1', limit: '10' }
      const mockValidator = vi.fn().mockReturnValue({ page: 1, limit: 10 })
      vi.mocked(getQuery).mockReturnValue(mockQuery)

      const result = getValidatedQuery(mockEvent, mockValidator)

      expect(getQuery).toHaveBeenCalledWith(mockEvent)
      expect(mockValidator).toHaveBeenCalledWith(mockQuery)
      expect(result).toEqual({ page: 1, limit: 10 })
    })

    it('should throw error when validation fails', () => {
      const mockQuery = { invalid: 'query' }
      const validationError = new Error('Invalid query')
      const mockValidator = vi.fn().mockImplementation(() => {
        throw validationError
      })
      vi.mocked(getQuery).mockReturnValue(mockQuery)

      expect(() => getValidatedQuery(mockEvent, mockValidator)).toThrow()

      expect(mockCreateError).toHaveBeenCalledWith({
        statusCode: 400,
        statusMessage: 'Invalid query parameters',
        data: { error: 'Invalid query' }
      })
    })
  })

  describe('getRouteParam', async () => {
    const { getRouterParam } = await import('h3')
    const mockCreateError = vi.mocked(createError)

    it('should return route parameter when present', () => {
      vi.mocked(getRouterParam).mockReturnValue('test-value')

      const result = getRouteParam(mockEvent, 'id')

      expect(getRouterParam).toHaveBeenCalledWith(mockEvent, 'id')
      expect(result).toBe('test-value')
    })

    it('should throw error when parameter is missing', () => {
      vi.mocked(getRouterParam).mockReturnValue(null)

      expect(() => getRouteParam(mockEvent, 'id')).toThrow()

      expect(mockCreateError).toHaveBeenCalledWith({
        statusCode: 400,
        statusMessage: 'Missing required parameter: id'
      })
    })

    it('should throw error when parameter is undefined', () => {
      vi.mocked(getRouterParam).mockReturnValue(undefined)

      expect(() => getRouteParam(mockEvent, 'id')).toThrow()

      expect(mockCreateError).toHaveBeenCalledWith({
        statusCode: 400,
        statusMessage: 'Missing required parameter: id'
      })
    })
  })

  describe('getNumericRouteParam', async () => {
    const { getRouterParam } = await import('h3')
    const mockCreateError = vi.mocked(createError)

    it('should parse and return numeric parameter', () => {
      vi.mocked(getRouterParam).mockReturnValue('123')

      const result = getNumericRouteParam(mockEvent, 'id')

      expect(result).toBe(123)
    })

    it('should handle string numbers with leading zeros', () => {
      vi.mocked(getRouterParam).mockReturnValue('0123')

      const result = getNumericRouteParam(mockEvent, 'id')

      expect(result).toBe(123) // parseInt handles leading zeros
    })

    it('should throw error for non-numeric values', () => {
      vi.mocked(getRouterParam).mockReturnValue('abc')

      expect(() => getNumericRouteParam(mockEvent, 'id')).toThrow()

      expect(mockCreateError).toHaveBeenCalledWith({
        statusCode: 400,
        statusMessage: 'Invalid numeric parameter: id'
      })
    })

    it('should throw error for empty string', () => {
      vi.mocked(getRouterParam).mockReturnValue('')

      expect(() => getNumericRouteParam(mockEvent, 'id')).toThrow()

      expect(mockCreateError).toHaveBeenCalledWith({
        statusCode: 400,
        statusMessage: 'Missing required parameter: id'
      })
    })

    it('should handle decimal numbers (truncated)', () => {
      vi.mocked(getRouterParam).mockReturnValue('123.45')

      const result = getNumericRouteParam(mockEvent, 'id')

      expect(result).toBe(123) // parseInt truncates decimals
    })

    it('should throw error for special numeric values', () => {
      vi.mocked(getRouterParam).mockReturnValue('Infinity')

      expect(() => getNumericRouteParam(mockEvent, 'id')).toThrow()

      expect(mockCreateError).toHaveBeenCalledWith({
        statusCode: 400,
        statusMessage: 'Invalid numeric parameter: id'
      })
    })
  })
})