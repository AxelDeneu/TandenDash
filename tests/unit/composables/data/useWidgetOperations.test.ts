import { describe, it, expect, beforeEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { useWidgetOperations } from '@/composables/data/useWidgetOperations'
import type { WidgetInstance, CreateWidgetRequest, UpdateWidgetRequest } from '@/types/widget'

// Mock dependencies
vi.mock('#app', () => ({
  useNuxtApp: () => ({
    $fetch: vi.fn()
  })
}))

const mockWidget: WidgetInstance = {
  id: 1,
  type: 'test',
  pageId: 1,
  position: { x: 0, y: 0, w: 2, h: 2 },
  options: { title: 'Test Widget' }
}

describe('useWidgetOperations Composable', () => {
  let mockFetch: ReturnType<typeof vi.fn>
  
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch = vi.fn()
    // @ts-ignore
    global.$fetch = mockFetch
  })

  describe('initialization', () => {
    it('should initialize with empty state', () => {
      const widgetOps = useWidgetOperations()

      expect(widgetOps.widgets.value).toEqual([])
      expect(widgetOps.loading.value).toBe(false)
      expect(widgetOps.error.value).toBeNull()
    })

    it('should provide all required methods', () => {
      const widgetOps = useWidgetOperations()

      expect(typeof widgetOps.fetchWidgets).toBe('function')
      expect(typeof widgetOps.createWidget).toBe('function')
      expect(typeof widgetOps.updateWidget).toBe('function')
      expect(typeof widgetOps.deleteWidget).toBe('function')
      expect(typeof widgetOps.findWidgetById).toBe('function')
    })
  })

  describe('fetchWidgets', () => {
    it('should fetch all widgets when no pageId provided', async () => {
      const widgets = [mockWidget]
      mockFetch.mockResolvedValue(widgets)

      const widgetOps = useWidgetOperations()
      await widgetOps.fetchWidgets()

      expect(mockFetch).toHaveBeenCalledWith('/api/widgets-instances', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      expect(widgetOps.widgets.value).toEqual(widgets)
    })

    it('should fetch widgets for specific page', async () => {
      const widgets = [mockWidget]
      mockFetch.mockResolvedValue(widgets)

      const widgetOps = useWidgetOperations()
      await widgetOps.fetchWidgets(1)

      expect(mockFetch).toHaveBeenCalledWith('/api/widgets-instances?pageId=1', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      expect(widgetOps.widgets.value).toEqual(widgets)
    })

    it('should handle API errors', async () => {
      const error = new Error('Fetch failed')
      mockFetch.mockRejectedValue(error)

      const widgetOps = useWidgetOperations()

      await expect(widgetOps.fetchWidgets()).rejects.toThrow('Fetch failed')
      expect(widgetOps.error.value).toEqual(error)
    })

    it('should handle non-array response', async () => {
      mockFetch.mockResolvedValue(null)

      const widgetOps = useWidgetOperations()
      await widgetOps.fetchWidgets()

      expect(widgetOps.widgets.value).toEqual([])
    })

    it('should update loading state during fetch', async () => {
      mockFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve([]), 10))
      )

      const widgetOps = useWidgetOperations()
      const fetchPromise = widgetOps.fetchWidgets()

      await nextTick()
      expect(widgetOps.loading.value).toBe(true)

      await fetchPromise
      expect(widgetOps.loading.value).toBe(false)
    })
  })

  describe('createWidget', () => {
    it('should create new widget', async () => {
      const newWidget = { ...mockWidget, id: 2 }
      const createData: CreateWidgetRequest = {
        type: 'test',
        pageId: 1,
        position: { x: 0, y: 0, w: 2, h: 2 },
        options: { title: 'New Widget' }
      }
      mockFetch.mockResolvedValue(newWidget)

      const widgetOps = useWidgetOperations()
      const result = await widgetOps.createWidget(createData)

      expect(mockFetch).toHaveBeenCalledWith('/api/widgets-instances', {
        method: 'POST',
        body: createData
      })
      expect(result).toEqual(newWidget)
      expect(widgetOps.widgets.value).toContain(newWidget)
    })

    it('should handle creation errors', async () => {
      const error = new Error('Creation failed')
      const createData: CreateWidgetRequest = {
        type: 'test',
        pageId: 1,
        position: { x: 0, y: 0, w: 2, h: 2 },
        options: {}
      }
      mockFetch.mockRejectedValue(error)

      const widgetOps = useWidgetOperations()

      await expect(widgetOps.createWidget(createData)).rejects.toThrow('Creation failed')
      expect(widgetOps.error.value).toEqual(error)
    })
  })

  describe('updateWidget', () => {
    it('should update existing widget', async () => {
      const updatedWidget = { ...mockWidget, options: { title: 'Updated' } }
      const updateData: UpdateWidgetRequest = {
        id: 1,
        options: { title: 'Updated' }
      }
      mockFetch.mockResolvedValue(updatedWidget)

      const widgetOps = useWidgetOperations()
      // First add the widget
      widgetOps.widgets.value.push(mockWidget)

      const result = await widgetOps.updateWidget(updateData)

      expect(mockFetch).toHaveBeenCalledWith('/api/widgets-instances', {
        method: 'PUT',
        body: updateData
      })
      expect(result).toEqual(updatedWidget)
      expect(widgetOps.widgets.value[0]).toEqual(updatedWidget)
    })

    it('should handle update errors', async () => {
      const error = new Error('Update failed')
      const updateData: UpdateWidgetRequest = { id: 1, options: {} }
      mockFetch.mockRejectedValue(error)

      const widgetOps = useWidgetOperations()

      await expect(widgetOps.updateWidget(updateData)).rejects.toThrow('Update failed')
      expect(widgetOps.error.value).toEqual(error)
    })
  })

  describe('deleteWidget', () => {
    it('should delete existing widget', async () => {
      mockFetch.mockResolvedValue(undefined)

      const widgetOps = useWidgetOperations()
      // First add the widget
      widgetOps.widgets.value.push(mockWidget)

      const result = await widgetOps.deleteWidget(1)

      expect(mockFetch).toHaveBeenCalledWith('/api/widgets-instances', {
        method: 'DELETE',
        body: { id: 1 }
      })
      expect(result).toBe(true)
      expect(widgetOps.widgets.value).toHaveLength(0)
    })

    it('should handle deletion errors', async () => {
      const error = new Error('Deletion failed')
      mockFetch.mockRejectedValue(error)

      const widgetOps = useWidgetOperations()

      await expect(widgetOps.deleteWidget(1)).rejects.toThrow('Deletion failed')
      expect(widgetOps.error.value).toEqual(error)
    })

    it('should handle deleting non-existent widget', async () => {
      mockFetch.mockResolvedValue(undefined)

      const widgetOps = useWidgetOperations()

      const result = await widgetOps.deleteWidget(999)

      expect(result).toBe(true)
      expect(widgetOps.widgets.value).toHaveLength(0)
    })
  })

  describe('findWidgetById', () => {
    it('should find existing widget', () => {
      const widgetOps = useWidgetOperations()
      widgetOps.widgets.value.push(mockWidget)

      const result = widgetOps.findWidgetById(1)

      expect(result).toEqual(mockWidget)
    })

    it('should return undefined for non-existent widget', () => {
      const widgetOps = useWidgetOperations()

      const result = widgetOps.findWidgetById(999)

      expect(result).toBeUndefined()
    })
  })

  describe('loading states', () => {
    it('should manage loading state for different operations', async () => {
      mockFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve([]), 10))
      )

      const widgetOps = useWidgetOperations()

      // Test fetch loading
      const fetchPromise = widgetOps.fetchWidgets()
      await nextTick()
      expect(widgetOps.loading.value).toBe(true)
      await fetchPromise
      expect(widgetOps.loading.value).toBe(false)

      // Test create loading
      mockFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockWidget), 10))
      )
      const createPromise = widgetOps.createWidget({
        type: 'test',
        pageId: 1,
        position: { x: 0, y: 0, w: 2, h: 2 },
        options: {}
      })
      await nextTick()
      expect(widgetOps.loading.value).toBe(true)
      await createPromise
      expect(widgetOps.loading.value).toBe(false)
    })
  })

  describe('singleton behavior', () => {
    it('should share state between instances', () => {
      const widgetOps1 = useWidgetOperations()
      const widgetOps2 = useWidgetOperations()

      widgetOps1.widgets.value.push(mockWidget)

      expect(widgetOps2.widgets.value).toContain(mockWidget)
      expect(widgetOps1.widgets.value).toBe(widgetOps2.widgets.value)
    })
  })

  describe('error handling', () => {
    it('should clear errors before operations', async () => {
      const error = new Error('Previous error')
      mockFetch.mockRejectedValue(error)

      const widgetOps = useWidgetOperations()

      // First operation fails
      await expect(widgetOps.fetchWidgets()).rejects.toThrow()
      expect(widgetOps.error.value).toEqual(error)

      // Second operation should clear error first
      mockFetch.mockResolvedValue([])
      await widgetOps.fetchWidgets()
      expect(widgetOps.error.value).toBeNull()
    })
  })

  describe('reactive updates', () => {
    it('should update widgets reactively for specific page', async () => {
      const pageWidgets = [mockWidget]
      const otherPageWidget = { ...mockWidget, id: 2, pageId: 2 }
      mockFetch.mockResolvedValue(pageWidgets)

      const widgetOps = useWidgetOperations()
      // Add widgets from different pages
      widgetOps.widgets.value.push(mockWidget, otherPageWidget)

      await widgetOps.fetchWidgets(1)

      // Should keep widgets from other pages and update page 1
      expect(widgetOps.widgets.value).toHaveLength(2)
      expect(widgetOps.widgets.value.some(w => w.pageId === 2)).toBe(true)
    })
  })
})