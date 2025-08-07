import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setHeader, getQuery, getRequestURL, createError } from 'h3'
import {
  createApiResponse,
  createPaginatedResponse,
  sendCachedResponse,
  handleApiError,
  parsePagination,
  withPerformanceMonitoring
} from '@/server/utils/response'

// Mock H3 functions
vi.mock('h3', async () => {
  const actual = await vi.importActual('h3')
  return {
    ...actual,
    setHeader: vi.fn(),
    getQuery: vi.fn(),
    getRequestURL: vi.fn(),
    createError: vi.fn()
  }
})

describe('Response Utils', () => {
  let mockEvent: any
  
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
  })

  describe('createApiResponse', () => {
    it('should create basic API response', () => {
      const data = { id: 1, name: 'test' }
      const response = createApiResponse(data)

      expect(response.data).toEqual(data)
      expect(response.timestamp).toBeDefined()
      expect(response.requestId).toBeDefined()
      expect(response.error).toBeUndefined()
      expect(response.message).toBeUndefined()
    })

    it('should create response with message', () => {
      const data = { id: 1 }
      const response = createApiResponse(data, { message: 'Success' })

      expect(response.data).toEqual(data)
      expect(response.message).toBe('Success')
    })

    it('should create response with error', () => {
      const response = createApiResponse(undefined, { error: 'Something went wrong' })

      expect(response.data).toBeUndefined()
      expect(response.error).toBe('Something went wrong')
    })

    it('should create response with custom requestId', () => {
      const customId = 'custom-request-id'
      const response = createApiResponse(null, { requestId: customId })

      expect(response.requestId).toBe(customId)
    })

    it('should generate timestamp in ISO format', () => {
      const response = createApiResponse({})
      const timestamp = new Date(response.timestamp)

      expect(timestamp).toBeInstanceOf(Date)
      expect(Math.abs(timestamp.getTime() - Date.now())).toBeLessThan(1000)
    })
  })

  describe('createPaginatedResponse', () => {
    it('should create paginated response with correct pagination info', () => {
      const data = [{ id: 1 }, { id: 2 }, { id: 3 }]
      const pagination = { page: 1, limit: 10, total: 25 }
      
      const response = createPaginatedResponse(data, pagination)

      expect(response.data).toEqual(data)
      expect(response.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNext: true,
        hasPrev: false
      })
    })

    it('should calculate pagination correctly for middle page', () => {
      const data = [{ id: 11 }, { id: 12 }]
      const pagination = { page: 2, limit: 10, total: 25 }
      
      const response = createPaginatedResponse(data, pagination)

      expect(response.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNext: true,
        hasPrev: true
      })
    })

    it('should calculate pagination correctly for last page', () => {
      const data = [{ id: 21 }]
      const pagination = { page: 3, limit: 10, total: 25 }
      
      const response = createPaginatedResponse(data, pagination)

      expect(response.pagination).toEqual({
        page: 3,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNext: false,
        hasPrev: true
      })
    })

    it('should handle exact division for total pages', () => {
      const data = []
      const pagination = { page: 1, limit: 10, total: 20 }
      
      const response = createPaginatedResponse(data, pagination)

      expect(response.pagination.totalPages).toBe(2)
    })

    it('should handle zero total items', () => {
      const data: any[] = []
      const pagination = { page: 1, limit: 10, total: 0 }
      
      const response = createPaginatedResponse(data, pagination)

      expect(response.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      })
    })
  })

  describe('sendCachedResponse', () => {
    
    it('should set cache headers when TTL is provided', () => {
      const data = { test: 'data' }
      const options = { ttl: 300 }
      
      const result = sendCachedResponse(mockEvent, data, options)

      expect(vi.mocked(setHeader)).toHaveBeenCalledWith(mockEvent, 'cache-control', 'public, max-age=300')
      expect(vi.mocked(setHeader)).toHaveBeenCalledWith(mockEvent, 'content-type', 'application/json')
    })

    it('should set cache headers with stale-while-revalidate', () => {
      const data = { test: 'data' }
      const options = { ttl: 300, staleWhileRevalidate: 600 }
      
      sendCachedResponse(mockEvent, data, options)

      expect(vi.mocked(setHeader)).toHaveBeenCalledWith(
        mockEvent, 
        'cache-control', 
        'public, max-age=300, stale-while-revalidate=600'
      )
    })

    it('should set cache headers with must-revalidate', () => {
      const data = { test: 'data' }
      const options = { ttl: 300, mustRevalidate: true }
      
      sendCachedResponse(mockEvent, data, options)

      expect(vi.mocked(setHeader)).toHaveBeenCalledWith(
        mockEvent, 
        'cache-control', 
        'public, max-age=300, must-revalidate'
      )
    })

    it('should not set cache headers when no TTL provided', () => {
      const data = { test: 'data' }
      
      sendCachedResponse(mockEvent, data)

      expect(vi.mocked(setHeader)).toHaveBeenCalledWith(mockEvent, 'content-type', 'application/json')
      expect(setHeader).not.toHaveBeenCalledWith(expect.anything(), 'cache-control', expect.anything())
    })

    it('should wrap object data in API response', () => {
      const data = { test: 'data' }
      
      const result = sendCachedResponse(mockEvent, data)

      expect(result).toHaveProperty('data', data)
      expect(result).toHaveProperty('timestamp')
      expect(result).toHaveProperty('requestId')
    })

    it('should return primitive data as-is', () => {
      const data = 'string data'
      
      const result = sendCachedResponse(mockEvent, data)

      expect(result).toBe(data)
    })
  })

  describe('handleApiError', async () => {
    const { createError, getRequestURL } = await import('h3')
    let consoleSpy: any

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.mocked(getRequestURL).mockReturnValue({ pathname: '/test' } as any)
    })

    afterEach(() => {
      consoleSpy?.mockRestore()
    })

    it('should handle Error objects', () => {
      const error = new Error('Test error')
      error.stack = 'Error: Test error\n    at test'

      expect(() => handleApiError(mockEvent, error, 400)).toThrow()

      expect(consoleSpy).toHaveBeenCalledWith('API Error:', expect.objectContaining({
        error: 'Test error',
        statusCode: 400,
        url: '/test',
        method: 'GET',
        stack: 'Error: Test error\n    at test'
      }))

      expect(createError).toHaveBeenCalledWith({
        statusCode: 400,
        statusMessage: 'Test error',
        data: expect.objectContaining({
          error: 'Test error'
        })
      })
    })

    it('should handle string errors', () => {
      const error = 'String error message'

      expect(() => handleApiError(mockEvent, error, 500)).toThrow()

      expect(consoleSpy).toHaveBeenCalledWith('API Error:', expect.objectContaining({
        error: 'String error message',
        statusCode: 500
      }))
    })

    it('should use default status code 500', () => {
      const error = new Error('Test error')

      expect(() => handleApiError(mockEvent, error)).toThrow()

      expect(createError).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 500
      }))
    })

    it('should include optional details', () => {
      const error = new Error('Test error')
      const options = {
        requestId: 'custom-id',
        details: { userId: 123, action: 'test' }
      }

      expect(() => handleApiError(mockEvent, error, 400, options)).toThrow()

      expect(consoleSpy).toHaveBeenCalledWith('API Error:', expect.objectContaining({
        requestId: 'custom-id',
        details: { userId: 123, action: 'test' }
      }))
    })
  })

  describe('parsePagination', async () => {
    const { getQuery } = await import('h3')

    it('should parse valid pagination parameters', () => {
      vi.mocked(getQuery).mockReturnValue({
        page: '2',
        limit: '15'
      })

      const result = parsePagination(mockEvent)

      expect(result).toEqual({
        page: 2,
        limit: 15,
        offset: 15
      })
    })

    it('should use defaults for missing parameters', () => {
      vi.mocked(getQuery).mockReturnValue({})

      const result = parsePagination(mockEvent)

      expect(result).toEqual({
        page: 1,
        limit: 20,
        offset: 0
      })
    })

    it('should enforce minimum page value', () => {
      vi.mocked(getQuery).mockReturnValue({
        page: '0'
      })

      const result = parsePagination(mockEvent)

      expect(result.page).toBe(1)
      expect(result.offset).toBe(0)
    })

    it('should enforce minimum and maximum limit values', () => {
      vi.mocked(getQuery).mockReturnValue({
        limit: '0'
      })

      let result = parsePagination(mockEvent)
      expect(result.limit).toBe(1)

      vi.mocked(getQuery).mockReturnValue({
        limit: '150'
      })

      result = parsePagination(mockEvent)
      expect(result.limit).toBe(100)
    })

    it('should handle invalid numeric values', () => {
      vi.mocked(getQuery).mockReturnValue({
        page: 'invalid',
        limit: 'abc'
      })

      const result = parsePagination(mockEvent)

      expect(result).toEqual({
        page: 1,
        limit: 20,
        offset: 0
      })
    })

    it('should calculate offset correctly', () => {
      vi.mocked(getQuery).mockReturnValue({
        page: '3',
        limit: '10'
      })

      const result = parsePagination(mockEvent)

      expect(result.offset).toBe(20) // (3-1) * 10
    })
  })

  describe('withPerformanceMonitoring', () => {
    let consoleSpy: any
    let consoleInfoSpy: any
    let consoleErrorSpy: any
    let performanceSpy: any

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      performanceSpy = vi.spyOn(performance, 'now')
    })

    afterEach(() => {
      consoleSpy?.mockRestore()
      consoleInfoSpy?.mockRestore()
      consoleErrorSpy?.mockRestore()
      performanceSpy?.mockRestore()
    })

    it('should monitor synchronous operations', () => {
      const operation = vi.fn().mockReturnValue('result')
      
      const result = withPerformanceMonitoring(operation, 'test-operation')

      expect(result).toBe('result')
      expect(operation).toHaveBeenCalled()
    })

    it('should monitor asynchronous operations', async () => {
      const operation = vi.fn().mockResolvedValue('async result')
      
      const result = await withPerformanceMonitoring(operation, 'async-operation')

      expect(result).toBe('async result')
      expect(operation).toHaveBeenCalled()
    })

    it('should log slow operations (>1000ms)', async () => {
      performanceSpy.mockReturnValueOnce(0).mockReturnValueOnce(1500)
      const slowOperation = vi.fn().mockReturnValue('result')

      withPerformanceMonitoring(slowOperation, 'slow-operation')

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Slow operation: slow-operation took 1500.00ms')
      )
    })

    it('should log moderately slow operations (>100ms)', () => {
      performanceSpy.mockReturnValueOnce(0).mockReturnValueOnce(150)
      const moderateOperation = vi.fn().mockReturnValue('result')

      withPerformanceMonitoring(moderateOperation, 'moderate-operation')

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('Operation: moderate-operation took 150.00ms')
      )
    })

    it('should handle synchronous errors', () => {
      const error = new Error('Sync error')
      performanceSpy.mockReturnValueOnce(0).mockReturnValueOnce(100)
      const faultOperation = vi.fn().mockImplementation(() => {
        throw error
      })

      expect(() => withPerformanceMonitoring(faultOperation, 'fault-operation')).toThrow(error)

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed operation: fault-operation took 100.00ms'),
        error
      )
    })

    it('should handle asynchronous errors', async () => {
      const error = new Error('Async error')
      performanceSpy.mockReturnValueOnce(0).mockReturnValueOnce(200)
      const faultOperation = vi.fn().mockImplementation(() => {
        return Promise.reject(error)
      })

      await expect(withPerformanceMonitoring(faultOperation, 'async-fault-operation')).rejects.toThrow(error)

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed operation: async-fault-operation took 200.00ms'),
        error
      )
    })
  })
})