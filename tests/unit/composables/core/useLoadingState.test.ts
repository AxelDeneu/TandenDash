import { describe, it, expect, beforeEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { useLoadingState } from '@/composables/core/useLoadingState'

describe('useLoadingState Composable', () => {
  let loadingState: ReturnType<typeof useLoadingState>

  beforeEach(() => {
    loadingState = useLoadingState()
  })

  describe('initialization', () => {
    it('should initialize with no loading states', () => {
      expect(loadingState.isLoading.value).toBe(false)
      expect(loadingState.getLoadingKeys()).toEqual([])
    })
  })

  describe('setLoading', () => {
    it('should set loading state for default key', async () => {
      loadingState.setLoading(true)

      expect(loadingState.isLoading.value).toBe(true)
      expect(loadingState.isLoadingKey('default')).toBe(true)
      expect(loadingState.getLoadingKeys()).toEqual(['default'])
    })

    it('should set loading state for custom key', async () => {
      loadingState.setLoading(true, 'custom-operation')

      expect(loadingState.isLoading.value).toBe(true)
      expect(loadingState.isLoadingKey('custom-operation')).toBe(true)
      expect(loadingState.getLoadingKeys()).toEqual(['custom-operation'])
    })

    it('should clear loading state', async () => {
      loadingState.setLoading(true)
      expect(loadingState.isLoading.value).toBe(true)

      loadingState.setLoading(false)
      expect(loadingState.isLoading.value).toBe(false)
      expect(loadingState.getLoadingKeys()).toEqual([])
    })

    it('should handle multiple loading keys', async () => {
      loadingState.setLoading(true, 'operation1')
      loadingState.setLoading(true, 'operation2')

      expect(loadingState.isLoading.value).toBe(true)
      expect(loadingState.getLoadingKeys()).toHaveLength(2)
      expect(loadingState.getLoadingKeys()).toContain('operation1')
      expect(loadingState.getLoadingKeys()).toContain('operation2')
    })

    it('should remain loading if one operation is still active', async () => {
      loadingState.setLoading(true, 'operation1')
      loadingState.setLoading(true, 'operation2')

      loadingState.setLoading(false, 'operation1')

      expect(loadingState.isLoading.value).toBe(true)
      expect(loadingState.isLoadingKey('operation1')).toBe(false)
      expect(loadingState.isLoadingKey('operation2')).toBe(true)
    })

    it('should stop loading when all operations complete', async () => {
      loadingState.setLoading(true, 'operation1')
      loadingState.setLoading(true, 'operation2')

      loadingState.setLoading(false, 'operation1')
      loadingState.setLoading(false, 'operation2')

      expect(loadingState.isLoading.value).toBe(false)
      expect(loadingState.getLoadingKeys()).toEqual([])
    })
  })

  describe('isLoadingKey', () => {
    it('should return false for non-existent key', () => {
      expect(loadingState.isLoadingKey('non-existent')).toBe(false)
    })

    it('should return true for active loading key', () => {
      loadingState.setLoading(true, 'test-key')

      expect(loadingState.isLoadingKey('test-key')).toBe(true)
    })

    it('should return false for cleared key', () => {
      loadingState.setLoading(true, 'test-key')
      loadingState.setLoading(false, 'test-key')

      expect(loadingState.isLoadingKey('test-key')).toBe(false)
    })
  })

  describe('withLoading', () => {
    it('should wrap async operation with loading state', async () => {
      const operation = vi.fn().mockResolvedValue('result')

      expect(loadingState.isLoading.value).toBe(false)

      const resultPromise = loadingState.withLoading(operation)

      // Loading should be true during operation
      expect(loadingState.isLoading.value).toBe(true)
      expect(loadingState.isLoadingKey('default')).toBe(true)

      const result = await resultPromise

      // Loading should be false after operation completes
      expect(loadingState.isLoading.value).toBe(false)
      expect(loadingState.isLoadingKey('default')).toBe(false)
      expect(result).toBe('result')
      expect(operation).toHaveBeenCalledOnce()
    })

    it('should use custom key for loading operation', async () => {
      const operation = vi.fn().mockResolvedValue('result')

      const resultPromise = loadingState.withLoading(operation, 'custom-key')

      expect(loadingState.isLoadingKey('custom-key')).toBe(true)
      expect(loadingState.isLoadingKey('default')).toBe(false)

      await resultPromise

      expect(loadingState.isLoadingKey('custom-key')).toBe(false)
    })

    it('should clear loading state even when operation throws', async () => {
      const error = new Error('Operation failed')
      const operation = vi.fn().mockRejectedValue(error)

      expect(loadingState.isLoading.value).toBe(false)

      await expect(loadingState.withLoading(operation)).rejects.toThrow(error)

      expect(loadingState.isLoading.value).toBe(false)
      expect(loadingState.getLoadingKeys()).toEqual([])
    })

    it('should handle multiple concurrent operations', async () => {
      const operation1 = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('result1'), 100))
      )
      const operation2 = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('result2'), 50))
      )

      const promise1 = loadingState.withLoading(operation1, 'op1')
      const promise2 = loadingState.withLoading(operation2, 'op2')

      expect(loadingState.isLoading.value).toBe(true)
      expect(loadingState.getLoadingKeys()).toHaveLength(2)

      const result2 = await promise2
      expect(result2).toBe('result2')
      expect(loadingState.isLoading.value).toBe(true) // Still loading op1
      expect(loadingState.isLoadingKey('op1')).toBe(true)
      expect(loadingState.isLoadingKey('op2')).toBe(false)

      const result1 = await promise1
      expect(result1).toBe('result1')
      expect(loadingState.isLoading.value).toBe(false)
      expect(loadingState.getLoadingKeys()).toEqual([])
    })

    it('should handle mixed success and failure operations', async () => {
      let resolveSuccess: (() => void) | undefined
      let rejectFail: ((error: Error) => void) | undefined

      const successOperation = vi.fn().mockImplementation(() => 
        new Promise<string>((resolve) => {
          resolveSuccess = () => resolve('success')
        })
      )
      
      const failOperation = vi.fn().mockImplementation(() => 
        new Promise<string>((_, reject) => {
          rejectFail = (error: Error) => reject(error)
        })
      )

      const successPromise = loadingState.withLoading(successOperation, 'success')
      const failPromise = loadingState.withLoading(failOperation, 'fail')

      expect(loadingState.getLoadingKeys()).toHaveLength(2)

      // Resolve success first
      resolveSuccess!()
      const successResult = await successPromise
      expect(successResult).toBe('success')
      expect(loadingState.isLoadingKey('success')).toBe(false)
      expect(loadingState.isLoadingKey('fail')).toBe(true)

      // Then fail the other operation
      rejectFail!(new Error('fail'))
      await expect(failPromise).rejects.toThrow('fail')
      expect(loadingState.isLoadingKey('fail')).toBe(false)
      expect(loadingState.isLoading.value).toBe(false)
    })
  })

  describe('clearLoading', () => {
    it('should clear all loading states', () => {
      loadingState.setLoading(true, 'operation1')
      loadingState.setLoading(true, 'operation2')
      loadingState.setLoading(true, 'operation3')

      expect(loadingState.getLoadingKeys()).toHaveLength(3)
      expect(loadingState.isLoading.value).toBe(true)

      loadingState.clearLoading()

      expect(loadingState.getLoadingKeys()).toEqual([])
      expect(loadingState.isLoading.value).toBe(false)
    })

    it('should clear loading during active operations', () => {
      loadingState.setLoading(true, 'operation1')
      loadingState.setLoading(true, 'operation2')

      loadingState.clearLoading()

      expect(loadingState.isLoading.value).toBe(false)
      expect(loadingState.isLoadingKey('operation1')).toBe(false)
      expect(loadingState.isLoadingKey('operation2')).toBe(false)
    })
  })

  describe('getLoadingKeys', () => {
    it('should return empty array when no operations are loading', () => {
      expect(loadingState.getLoadingKeys()).toEqual([])
    })

    it('should return array of active loading keys', () => {
      loadingState.setLoading(true, 'key1')
      loadingState.setLoading(true, 'key2')
      loadingState.setLoading(true, 'key3')

      const keys = loadingState.getLoadingKeys()
      expect(keys).toHaveLength(3)
      expect(keys).toContain('key1')
      expect(keys).toContain('key2')
      expect(keys).toContain('key3')
    })

    it('should return copy of keys array', () => {
      loadingState.setLoading(true, 'test-key')

      const keys1 = loadingState.getLoadingKeys()
      const keys2 = loadingState.getLoadingKeys()

      expect(keys1).not.toBe(keys2) // Different array instances
      expect(keys1).toEqual(keys2) // Same content
    })
  })

  describe('reactive behavior', () => {
    it('should trigger reactivity when loading state changes', async () => {
      const watcher = vi.fn()

      // Watch the computed property
      let isLoadingValue = loadingState.isLoading.value
      const stopWatching = () => {
        // Simple reactivity test - check value changes
        const newValue = loadingState.isLoading.value
        if (newValue !== isLoadingValue) {
          watcher(newValue, isLoadingValue)
          isLoadingValue = newValue
        }
      }

      loadingState.setLoading(true)
      await nextTick()
      stopWatching()

      expect(loadingState.isLoading.value).toBe(true)

      loadingState.setLoading(false)
      await nextTick()
      stopWatching()

      expect(loadingState.isLoading.value).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should handle duplicate setLoading calls', () => {
      loadingState.setLoading(true, 'test-key')
      loadingState.setLoading(true, 'test-key') // Duplicate

      expect(loadingState.getLoadingKeys()).toEqual(['test-key'])
      expect(loadingState.isLoading.value).toBe(true)
    })

    it('should handle clearing non-existent key', () => {
      loadingState.setLoading(false, 'non-existent-key')

      expect(loadingState.isLoading.value).toBe(false)
      expect(loadingState.getLoadingKeys()).toEqual([])
    })

    it('should handle empty string as key', () => {
      loadingState.setLoading(true, '')

      expect(loadingState.isLoadingKey('')).toBe(true)
      expect(loadingState.getLoadingKeys()).toEqual([''])
      expect(loadingState.isLoading.value).toBe(true)
    })
  })
})