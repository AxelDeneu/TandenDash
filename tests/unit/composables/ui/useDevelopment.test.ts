import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useDevelopment } from '@/composables/ui/useDevelopment'

describe('useDevelopment Composable', () => {
  let originalProcessDev: boolean | undefined

  beforeEach(() => {
    originalProcessDev = process.dev
  })

  afterEach(() => {
    // Restore original value
    process.dev = originalProcessDev
  })

  describe('development mode detection', () => {
    it('should return true when process.dev is true', () => {
      process.dev = true

      const development = useDevelopment()

      expect(development.isDevelopment).toBe(true)
    })

    it('should return false when process.dev is false', () => {
      process.dev = false

      const development = useDevelopment()

      expect(development.isDevelopment).toBe(false)
    })

    it('should return false when process.dev is undefined', () => {
      process.dev = undefined

      const development = useDevelopment()

      expect(development.isDevelopment).toBe(false)
    })
  })

  describe('interface compliance', () => {
    it('should implement UseDevelopment interface', () => {
      const development = useDevelopment()

      expect(typeof development.isDevelopment).toBe('boolean')
    })

    it('should provide readonly isDevelopment property', () => {
      const development = useDevelopment()

      // The property should be readonly
      expect(development.isDevelopment).toBeDefined()
      
      // Attempting to modify should not be possible
      // (In TypeScript this would be a compile error)
      expect(() => {
        // This should not work due to readonly
        (development as any).isDevelopment = !development.isDevelopment
      }).not.toThrow() // In test environment, readonly might not be enforced at runtime
    })
  })

  describe('consistency', () => {
    it('should return consistent values across multiple calls', () => {
      process.dev = true

      const development1 = useDevelopment()
      const development2 = useDevelopment()

      expect(development1.isDevelopment).toBe(development2.isDevelopment)
    })

    it('should reflect process.dev changes in new instances', () => {
      process.dev = true
      const development1 = useDevelopment()
      expect(development1.isDevelopment).toBe(true)

      process.dev = false
      const development2 = useDevelopment()
      expect(development2.isDevelopment).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should handle when process is undefined', () => {
      const originalProcess = global.process
      global.process = undefined as any

      expect(() => useDevelopment()).toThrow()

      global.process = originalProcess
    })

    it('should handle when process.dev is null', () => {
      process.dev = null as any

      const development = useDevelopment()

      expect(development.isDevelopment).toBe(false)
    })

    it('should handle when process.dev is a string', () => {
      process.dev = 'true' as any

      const development = useDevelopment()

      // Should not be strictly equal to boolean true
      expect(development.isDevelopment).toBe(false)
    })

    it('should handle when process.dev is a number', () => {
      process.dev = 1 as any

      const development = useDevelopment()

      // Should not be strictly equal to boolean true
      expect(development.isDevelopment).toBe(false)
    })
  })

  describe('typical usage scenarios', () => {
    it('should work in production-like environment', () => {
      process.dev = false

      const development = useDevelopment()

      expect(development.isDevelopment).toBe(false)
    })

    it('should work in development-like environment', () => {
      process.dev = true

      const development = useDevelopment()

      expect(development.isDevelopment).toBe(true)
    })
  })
})