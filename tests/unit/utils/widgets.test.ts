import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mergeWithDefaults, getWidgetDefaults } from '@/lib/widgets/utils'
import { widgetCore } from '@/lib/widgets/WidgetCore'

vi.mock('@/lib/widgets/WidgetCore', () => ({
  widgetCore: {
    getPlugin: vi.fn()
  }
}))

describe('Widget Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('mergeWithDefaults', () => {
    it('should return options unchanged when no plugin is found', () => {
      const mockGetPlugin = vi.mocked(widgetCore.getPlugin)
      mockGetPlugin.mockReturnValue(null)

      const options = { customOption: 'value' }
      const result = mergeWithDefaults('nonexistent-widget', options)

      expect(result).toBe(options)
      expect(mockGetPlugin).toHaveBeenCalledWith('nonexistent-widget')
    })

    it('should return options unchanged when plugin has no defaultConfig', () => {
      const mockGetPlugin = vi.mocked(widgetCore.getPlugin)
      mockGetPlugin.mockReturnValue({ 
        id: 'test-widget',
        component: null,
        defaultConfig: null 
      } as any)

      const options = { customOption: 'value' }
      const result = mergeWithDefaults('test-widget', options)

      expect(result).toBe(options)
    })

    it('should merge options with default config', () => {
      const mockGetPlugin = vi.mocked(widgetCore.getPlugin)
      const defaultConfig = {
        title: 'Default Title',
        showBorder: true,
        theme: 'light'
      }
      
      mockGetPlugin.mockReturnValue({
        id: 'test-widget',
        component: null,
        defaultConfig
      } as any)

      const options = {
        title: 'Custom Title',
        customOption: 'value'
      }

      const result = mergeWithDefaults('test-widget', options)

      expect(result).toEqual({
        title: 'Custom Title', // Should use provided value
        showBorder: true,      // Should use default
        theme: 'light',        // Should use default
        customOption: 'value'  // Should preserve custom option
      })
    })

    it('should preserve all existing options when merging', () => {
      const mockGetPlugin = vi.mocked(widgetCore.getPlugin)
      const defaultConfig = {
        setting1: 'default1',
        setting2: false
      }
      
      mockGetPlugin.mockReturnValue({
        id: 'test-widget',
        component: null,
        defaultConfig
      } as any)

      const options = {
        setting1: 'custom1',
        setting2: true,
        setting3: 'only-in-options',
        nestedObject: {
          nested1: 'value1',
          nested2: 'value2'
        }
      }

      const result = mergeWithDefaults('test-widget', options)

      expect(result).toEqual({
        setting1: 'custom1',
        setting2: true,
        setting3: 'only-in-options',
        nestedObject: {
          nested1: 'value1',
          nested2: 'value2'
        }
      })
    })

    it('should handle empty options object', () => {
      const mockGetPlugin = vi.mocked(widgetCore.getPlugin)
      const defaultConfig = {
        title: 'Default Title',
        enabled: true
      }
      
      mockGetPlugin.mockReturnValue({
        id: 'test-widget',
        component: null,
        defaultConfig
      } as any)

      const result = mergeWithDefaults('test-widget', {})

      expect(result).toEqual(defaultConfig)
    })

    it('should handle empty default config', () => {
      const mockGetPlugin = vi.mocked(widgetCore.getPlugin)
      mockGetPlugin.mockReturnValue({
        id: 'test-widget',
        component: null,
        defaultConfig: {}
      } as any)

      const options = { customOption: 'value' }
      const result = mergeWithDefaults('test-widget', options)

      expect(result).toEqual(options)
    })

    it('should handle null and undefined values correctly', () => {
      const mockGetPlugin = vi.mocked(widgetCore.getPlugin)
      const defaultConfig = {
        title: 'Default Title',
        count: 0,
        enabled: true,
        nullable: null
      }
      
      mockGetPlugin.mockReturnValue({
        id: 'test-widget',
        component: null,
        defaultConfig
      } as any)

      const options = {
        title: null,
        count: undefined,
        disabled: false
      }

      const result = mergeWithDefaults('test-widget', options)

      expect(result).toEqual({
        title: null,        // Should preserve explicit null
        count: undefined,   // Should preserve explicit undefined
        enabled: true,      // Should use default
        nullable: null,     // Should use default
        disabled: false     // Should preserve custom value
      })
    })
  })

  describe('getWidgetDefaults', () => {
    it('should return null when no plugin is found', () => {
      const mockGetPlugin = vi.mocked(widgetCore.getPlugin)
      mockGetPlugin.mockReturnValue(null)

      const result = getWidgetDefaults('nonexistent-widget')

      expect(result).toBeNull()
      expect(mockGetPlugin).toHaveBeenCalledWith('nonexistent-widget')
    })

    it('should return null when plugin has no defaultConfig', () => {
      const mockGetPlugin = vi.mocked(widgetCore.getPlugin)
      mockGetPlugin.mockReturnValue({
        id: 'test-widget',
        component: null,
        defaultConfig: null
      } as any)

      const result = getWidgetDefaults('test-widget')

      expect(result).toBeNull()
    })

    it('should return default config when available', () => {
      const mockGetPlugin = vi.mocked(widgetCore.getPlugin)
      const defaultConfig = {
        title: 'Default Title',
        showBorder: true,
        theme: 'light'
      }
      
      mockGetPlugin.mockReturnValue({
        id: 'test-widget',
        component: null,
        defaultConfig
      } as any)

      const result = getWidgetDefaults('test-widget')

      expect(result).toEqual(defaultConfig)
    })

    it('should return empty object when defaultConfig is empty', () => {
      const mockGetPlugin = vi.mocked(widgetCore.getPlugin)
      mockGetPlugin.mockReturnValue({
        id: 'test-widget',
        component: null,
        defaultConfig: {}
      } as any)

      const result = getWidgetDefaults('test-widget')

      expect(result).toEqual({})
    })

    it('should handle undefined defaultConfig as null', () => {
      const mockGetPlugin = vi.mocked(widgetCore.getPlugin)
      mockGetPlugin.mockReturnValue({
        id: 'test-widget',
        component: null,
        defaultConfig: undefined
      } as any)

      const result = getWidgetDefaults('test-widget')

      expect(result).toBeNull()
    })
  })
})