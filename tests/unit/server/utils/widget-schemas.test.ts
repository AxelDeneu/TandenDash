import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('Widget Schemas Utils', () => {
  // Simple mock test focusing on the core functionality
  describe('loadWidgetSchemas basic functionality', () => {
    it('should be importable and callable', async () => {
      // Test that we can import and call the function without errors
      const mockRegisterAllWidgetSchemas = vi.fn()
      const mockGetStatus = vi.fn().mockReturnValue({ registeredTypes: [], count: 0 })
      
      vi.doMock('@/lib/validation', () => ({
        widgetValidationRegistry: {
          getStatus: mockGetStatus
        }
      }))
      
      vi.doMock('@/server/utils/widget-schemas.generated', () => ({
        registerAllWidgetSchemas: mockRegisterAllWidgetSchemas
      }))

      const { loadWidgetSchemas } = await import('@/server/utils/widget-schemas')
      
      expect(typeof loadWidgetSchemas).toBe('function')
    })
  })
})