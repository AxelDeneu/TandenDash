import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref, nextTick } from 'vue'
import { usePageOperations } from '@/composables/data/usePageOperations'
import type { Page, CreatePageRequest, UpdatePageRequest } from '@/types/page'

// Mock dependencies
vi.mock('#app', () => ({
  useNuxtApp: () => ({
    $fetch: vi.fn()
  })
}))

const mockPage: Page = {
  id: 1,
  name: 'Test Page',
  dashboardId: 1,
  snapping: true,
  gridRows: 12,
  gridCols: 12,
  marginTop: 0,
  marginRight: 0,
  marginBottom: 0,
  marginLeft: 0
}

describe('usePageOperations Composable', () => {
  let mockFetch: ReturnType<typeof vi.fn>
  
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch = vi.fn()
    // @ts-ignore
    global.$fetch = mockFetch
  })

  describe('initialization', () => {
    it('should initialize with empty state', () => {
      const pageOps = usePageOperations()

      expect(pageOps.pages.value).toEqual([])
      expect(pageOps.currentPage.value).toBeNull()
      expect(pageOps.loading.value).toBe(false)
      expect(pageOps.error.value).toBeNull()
    })

    it('should initialize with dashboard-specific state', () => {
      const dashboardId = ref(1)
      const pageOps = usePageOperations(dashboardId)

      expect(pageOps.pages.value).toEqual([])
      expect(pageOps.currentPage.value).toBeNull()
    })

    it('should provide all required methods', () => {
      const pageOps = usePageOperations()

      expect(typeof pageOps.fetchPages).toBe('function')
      expect(typeof pageOps.fetchPage).toBe('function')
      expect(typeof pageOps.createPage).toBe('function')
      expect(typeof pageOps.updatePage).toBe('function')
      expect(typeof pageOps.deletePage).toBe('function')
      expect(typeof pageOps.setCurrentPage).toBe('function')
      expect(typeof pageOps.findPageById).toBe('function')
      expect(typeof pageOps.getNextPage).toBe('function')
      expect(typeof pageOps.getPreviousPage).toBe('function')
    })
  })

  describe('fetchPages', () => {
    it('should fetch all pages when no dashboard specified', async () => {
      const pages = [mockPage]
      mockFetch.mockResolvedValue(pages)

      const pageOps = usePageOperations()
      await pageOps.fetchPages()

      expect(mockFetch).toHaveBeenCalledWith('/api/pages')
      expect(pageOps.pages.value).toEqual(pages)
      expect(pageOps.currentPage.value).toEqual(mockPage)
    })

    it('should fetch pages for specific dashboard', async () => {
      const dashboardId = ref(1)
      const pages = [mockPage]
      mockFetch.mockResolvedValue(pages)

      const pageOps = usePageOperations(dashboardId)
      await pageOps.fetchPages()

      expect(mockFetch).toHaveBeenCalledWith('/api/dashboards/1/pages')
      expect(pageOps.pages.value).toEqual(pages)
    })

    it('should handle API errors', async () => {
      const error = new Error('Fetch failed')
      mockFetch.mockRejectedValue(error)

      const pageOps = usePageOperations()

      await expect(pageOps.fetchPages()).rejects.toThrow('Fetch failed')
      expect(pageOps.error.value).toEqual(error)
    })

    it('should handle non-array response', async () => {
      mockFetch.mockResolvedValue(null)

      const pageOps = usePageOperations()
      await pageOps.fetchPages()

      expect(pageOps.pages.value).toEqual([])
    })

    it('should not set current page if pages already exist', async () => {
      const existingPage = { ...mockPage, id: 2, name: 'Existing Page' }
      const newPages = [mockPage]
      mockFetch.mockResolvedValue(newPages)

      const pageOps = usePageOperations()
      pageOps.setCurrentPage(existingPage)

      await pageOps.fetchPages()

      // Should not change current page
      expect(pageOps.currentPage.value).toEqual(existingPage)
    })
  })

  describe('fetchPage', () => {
    it('should fetch specific page and update existing', async () => {
      const updatedPage = { ...mockPage, name: 'Updated Page' }
      mockFetch.mockResolvedValue(updatedPage)

      const pageOps = usePageOperations()
      // Add initial page
      pageOps.pages.value.push(mockPage)

      await pageOps.fetchPage(1)

      expect(mockFetch).toHaveBeenCalledWith('/api/pages/1')
      expect(pageOps.pages.value[0]).toEqual(updatedPage)
    })

    it('should add new page if not exists', async () => {
      const newPage = { ...mockPage, id: 2, name: 'New Page' }
      mockFetch.mockResolvedValue(newPage)

      const pageOps = usePageOperations()

      await pageOps.fetchPage(2)

      expect(pageOps.pages.value).toContain(newPage)
    })
  })

  describe('createPage', () => {
    it('should create new page without dashboard', async () => {
      const newPage = { ...mockPage, id: 2 }
      const createData: CreatePageRequest = {
        name: 'New Page',
        dashboardId: 1,
        snapping: true,
        gridRows: 12,
        gridCols: 12,
        marginTop: 0,
        marginRight: 0,
        marginBottom: 0,
        marginLeft: 0
      }
      mockFetch.mockResolvedValue(newPage)

      const pageOps = usePageOperations()
      const result = await pageOps.createPage(createData)

      expect(mockFetch).toHaveBeenCalledWith('/api/pages', {
        method: 'POST',
        body: createData
      })
      expect(result).toEqual(newPage)
      expect(pageOps.pages.value).toContain(newPage)
      expect(pageOps.currentPage.value).toEqual(newPage) // First page becomes current
    })

    it('should create new page with dashboard id', async () => {
      const dashboardId = ref(1)
      const newPage = { ...mockPage, id: 2 }
      const createData: CreatePageRequest = {
        name: 'New Page',
        dashboardId: 1,
        snapping: true,
        gridRows: 12,
        gridCols: 12,
        marginTop: 0,
        marginRight: 0,
        marginBottom: 0,
        marginLeft: 0
      }
      mockFetch.mockResolvedValue(newPage)

      const pageOps = usePageOperations(dashboardId)
      const result = await pageOps.createPage(createData)

      expect(mockFetch).toHaveBeenCalledWith('/api/pages', {
        method: 'POST',
        body: { ...createData, dashboardId: 1 }
      })
      expect(result).toEqual(newPage)
    })

    it('should handle creation errors', async () => {
      const error = new Error('Creation failed')
      const createData: CreatePageRequest = {
        name: 'New Page',
        dashboardId: 1,
        snapping: true,
        gridRows: 12,
        gridCols: 12,
        marginTop: 0,
        marginRight: 0,
        marginBottom: 0,
        marginLeft: 0
      }
      mockFetch.mockRejectedValue(error)

      const pageOps = usePageOperations()

      await expect(pageOps.createPage(createData)).rejects.toThrow('Creation failed')
      expect(pageOps.error.value).toEqual(error)
    })
  })

  describe('updatePage', () => {
    it('should update existing page', async () => {
      const updatedPage = { ...mockPage, name: 'Updated Page' }
      const updateData: UpdatePageRequest = { name: 'Updated Page' }
      mockFetch.mockResolvedValue(updatedPage)

      const pageOps = usePageOperations()
      // Add initial page
      pageOps.pages.value.push(mockPage)
      pageOps.setCurrentPage(mockPage)

      const result = await pageOps.updatePage(1, updateData)

      expect(mockFetch).toHaveBeenCalledWith('/api/pages', {
        method: 'PUT',
        body: { id: 1, ...updateData }
      })
      expect(result).toEqual(updatedPage)
      expect(pageOps.pages.value[0]).toEqual(updatedPage)
      expect(pageOps.currentPage.value).toEqual(updatedPage)
    })

    it('should handle update errors', async () => {
      const error = new Error('Update failed')
      const updateData: UpdatePageRequest = { name: 'Updated' }
      mockFetch.mockRejectedValue(error)

      const pageOps = usePageOperations()

      await expect(pageOps.updatePage(1, updateData)).rejects.toThrow('Update failed')
      expect(pageOps.error.value).toEqual(error)
    })
  })

  describe('deletePage', () => {
    it('should delete existing page', async () => {
      mockFetch.mockResolvedValue(undefined)

      const pageOps = usePageOperations()
      pageOps.pages.value.push(mockPage)
      pageOps.setCurrentPage(mockPage)

      const result = await pageOps.deletePage(1)

      expect(mockFetch).toHaveBeenCalledWith('/api/pages', {
        method: 'DELETE',
        body: { id: 1 }
      })
      expect(result).toBe(true)
      expect(pageOps.pages.value).toHaveLength(0)
      expect(pageOps.currentPage.value).toBeNull()
    })

    it('should update current page when deleting non-current page', async () => {
      const page2 = { ...mockPage, id: 2, name: 'Page 2' }
      mockFetch.mockResolvedValue(undefined)

      const pageOps = usePageOperations()
      pageOps.pages.value.push(mockPage, page2)
      pageOps.setCurrentPage(page2)

      await pageOps.deletePage(1)

      expect(pageOps.pages.value).toHaveLength(1)
      expect(pageOps.currentPage.value).toEqual(page2)
    })

    it('should handle deletion errors', async () => {
      const error = new Error('Deletion failed')
      mockFetch.mockRejectedValue(error)

      const pageOps = usePageOperations()

      await expect(pageOps.deletePage(1)).rejects.toThrow('Deletion failed')
      expect(pageOps.error.value).toEqual(error)
    })
  })

  describe('utility methods', () => {
    it('should find page by id', () => {
      const pageOps = usePageOperations()
      pageOps.pages.value.push(mockPage)

      const result = pageOps.findPageById(1)

      expect(result).toEqual(mockPage)
    })

    it('should return undefined for non-existent page', () => {
      const pageOps = usePageOperations()

      const result = pageOps.findPageById(999)

      expect(result).toBeUndefined()
    })

    it('should get next page', () => {
      const page2 = { ...mockPage, id: 2, name: 'Page 2' }
      const pageOps = usePageOperations()
      pageOps.pages.value.push(mockPage, page2)
      pageOps.setCurrentPage(mockPage)

      const result = pageOps.getNextPage()

      expect(result).toEqual(page2)
    })

    it('should wrap around for next page', () => {
      const page2 = { ...mockPage, id: 2, name: 'Page 2' }
      const pageOps = usePageOperations()
      pageOps.pages.value.push(mockPage, page2)
      pageOps.setCurrentPage(page2)

      const result = pageOps.getNextPage()

      expect(result).toEqual(mockPage)
    })

    it('should get previous page', () => {
      const page2 = { ...mockPage, id: 2, name: 'Page 2' }
      const pageOps = usePageOperations()
      pageOps.pages.value.push(mockPage, page2)
      pageOps.setCurrentPage(page2)

      const result = pageOps.getPreviousPage()

      expect(result).toEqual(mockPage)
    })

    it('should return null for next/previous with single page', () => {
      const pageOps = usePageOperations()
      pageOps.pages.value.push(mockPage)
      pageOps.setCurrentPage(mockPage)

      expect(pageOps.getNextPage()).toBeNull()
      expect(pageOps.getPreviousPage()).toBeNull()
    })
  })

  describe('dashboard integration', () => {
    it('should watch dashboard changes and reload pages', async () => {
      const dashboardId = ref(1)
      mockFetch.mockResolvedValue([mockPage])

      const pageOps = usePageOperations(dashboardId)

      // Change dashboard
      dashboardId.value = 2
      await nextTick()

      expect(mockFetch).toHaveBeenCalledWith('/api/dashboards/2/pages')
    })

    it('should clear pages when dashboard becomes null', async () => {
      const dashboardId = ref(1)
      const pageOps = usePageOperations(dashboardId)
      pageOps.pages.value.push(mockPage)
      pageOps.setCurrentPage(mockPage)

      dashboardId.value = null
      await nextTick()

      expect(pageOps.pages.value).toEqual([])
      expect(pageOps.currentPage.value).toBeNull()
    })
  })

  describe('loading states', () => {
    it('should manage loading state for operations', async () => {
      mockFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve([]), 10))
      )

      const pageOps = usePageOperations()

      const fetchPromise = pageOps.fetchPages()
      await nextTick()
      expect(pageOps.loading.value).toBe(true)

      await fetchPromise
      expect(pageOps.loading.value).toBe(false)
    })
  })

  describe('error handling', () => {
    it('should clear errors before operations', async () => {
      const error = new Error('Previous error')
      mockFetch.mockRejectedValue(error)

      const pageOps = usePageOperations()

      // First operation fails
      await expect(pageOps.fetchPages()).rejects.toThrow()
      expect(pageOps.error.value).toEqual(error)

      // Second operation should clear error first
      mockFetch.mockResolvedValue([])
      await pageOps.fetchPages()
      expect(pageOps.error.value).toBeNull()
    })
  })

  describe('setCurrentPage', () => {
    it('should set current page', () => {
      const pageOps = usePageOperations()

      pageOps.setCurrentPage(mockPage)

      expect(pageOps.currentPage.value).toEqual(mockPage)
    })
  })
})