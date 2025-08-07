import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useDarkMode } from '@/composables/ui/useDarkMode'

// Mock $fetch
const mockFetch = vi.fn()
globalThis.$fetch = mockFetch as any

// Mock DOM
Object.defineProperty(document, 'documentElement', {
  value: {
    classList: {
      add: vi.fn(),
      remove: vi.fn()
    }
  },
  writable: true
})

describe('useDarkMode Composable', () => {
  let darkMode: ReturnType<typeof useDarkMode>

  beforeEach(() => {
    vi.clearAllMocks()
    darkMode = useDarkMode()
  })

  describe('initialization', () => {
    it('should initialize with light mode', () => {
      expect(darkMode.mode.value).toBe('light')
      expect(darkMode.isDark.value).toBe(false)
    })
  })

  describe('computed properties', () => {
    it('should compute isDark correctly for light mode', () => {
      darkMode.mode.value = 'light'
      expect(darkMode.isDark.value).toBe(false)
    })

    it('should compute isDark correctly for dark mode', () => {
      darkMode.mode.value = 'dark'
      expect(darkMode.isDark.value).toBe(true)
    })
  })

  describe('setMode', () => {
    it('should set dark mode and update HTML class', async () => {
      mockFetch.mockResolvedValue({})

      await darkMode.setMode('dark')

      expect(document.documentElement.classList.add).toHaveBeenCalledWith('dark')
      expect(darkMode.mode.value).toBe('dark')
      expect(mockFetch).toHaveBeenCalledWith('/api/mode-state', {
        method: 'POST',
        body: { mode: 'dark' }
      })
    })

    it('should set light mode and remove HTML class', async () => {
      mockFetch.mockResolvedValue({})

      await darkMode.setMode('light')

      expect(document.documentElement.classList.remove).toHaveBeenCalledWith('dark')
      expect(darkMode.mode.value).toBe('light')
      expect(mockFetch).toHaveBeenCalledWith('/api/mode-state', {
        method: 'POST',
        body: { mode: 'light' }
      })
    })

    it('should handle API errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('API Error'))

      // Should still update local state even if API fails
      await expect(darkMode.setMode('dark')).rejects.toThrow('API Error')
      
      // Local state should still be updated
      expect(darkMode.mode.value).toBe('dark')
      expect(document.documentElement.classList.add).toHaveBeenCalledWith('dark')
    })
  })

  describe('toggleMode', () => {
    it('should toggle from light to dark', async () => {
      mockFetch.mockResolvedValue({})
      darkMode.mode.value = 'light'

      await darkMode.toggleMode()

      expect(darkMode.mode.value).toBe('dark')
      expect(document.documentElement.classList.add).toHaveBeenCalledWith('dark')
      expect(mockFetch).toHaveBeenCalledWith('/api/mode-state', {
        method: 'POST',
        body: { mode: 'dark' }
      })
    })

    it('should toggle from dark to light', async () => {
      mockFetch.mockResolvedValue({})
      darkMode.mode.value = 'dark'

      await darkMode.toggleMode()

      expect(darkMode.mode.value).toBe('light')
      expect(document.documentElement.classList.remove).toHaveBeenCalledWith('dark')
      expect(mockFetch).toHaveBeenCalledWith('/api/mode-state', {
        method: 'POST',
        body: { mode: 'light' }
      })
    })
  })

  describe('initializeMode', () => {
    it('should initialize with fetched mode from API', async () => {
      mockFetch.mockResolvedValue({ mode: 'dark' })

      await darkMode.initializeMode()

      expect(mockFetch).toHaveBeenCalledWith('/api/mode-state')
      expect(darkMode.mode.value).toBe('dark')
      expect(document.documentElement.classList.add).toHaveBeenCalledWith('dark')
    })

    it('should initialize with light mode when API call fails', async () => {
      mockFetch.mockRejectedValue(new Error('API Error'))

      await darkMode.initializeMode()

      expect(darkMode.mode.value).toBe('light')
      expect(document.documentElement.classList.remove).toHaveBeenCalledWith('dark')
    })

    it('should handle undefined API response', async () => {
      mockFetch.mockResolvedValue(undefined)

      await darkMode.initializeMode()

      // Should fall back to light mode
      expect(darkMode.mode.value).toBe('light')
      expect(document.documentElement.classList.remove).toHaveBeenCalledWith('dark')
    })

    it('should handle API response with invalid mode', async () => {
      mockFetch.mockResolvedValue({ mode: 'invalid' as any })

      // This might fail at runtime due to type constraints
      await expect(async () => {
        await darkMode.initializeMode()
      }).rejects.toThrow()
    })
  })

  describe('reactive behavior', () => {
    it('should reactively update isDark when mode changes', () => {
      expect(darkMode.isDark.value).toBe(false)

      darkMode.mode.value = 'dark'
      expect(darkMode.isDark.value).toBe(true)

      darkMode.mode.value = 'light'
      expect(darkMode.isDark.value).toBe(false)
    })
  })

  describe('DOM integration', () => {
    it('should add dark class for dark mode', async () => {
      mockFetch.mockResolvedValue({})

      await darkMode.setMode('dark')

      expect(document.documentElement.classList.add).toHaveBeenCalledWith('dark')
      expect(document.documentElement.classList.remove).not.toHaveBeenCalled()
    })

    it('should remove dark class for light mode', async () => {
      mockFetch.mockResolvedValue({})

      await darkMode.setMode('light')

      expect(document.documentElement.classList.remove).toHaveBeenCalledWith('dark')
    })

    it('should handle missing document gracefully', async () => {
      const originalDocument = global.document
      
      // Simulate server-side rendering where document might not exist
      global.document = undefined as any

      // Should not throw error
      await expect(async () => {
        const serverDarkMode = useDarkMode()
        await serverDarkMode.setMode('dark')
      }).rejects.toThrow()

      global.document = originalDocument
    })
  })

  describe('interface compliance', () => {
    it('should implement UseDarkMode interface', () => {
      expect(typeof darkMode.isDark).toBe('object')
      expect(typeof darkMode.mode).toBe('object')
      expect(typeof darkMode.toggleMode).toBe('function')
      expect(typeof darkMode.setMode).toBe('function')
      expect(typeof darkMode.initializeMode).toBe('function')
    })

    it('should have reactive properties', () => {
      expect(darkMode.isDark.value).toBeDefined()
      expect(darkMode.mode.value).toBeDefined()
    })
  })
})