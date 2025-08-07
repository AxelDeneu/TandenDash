import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PageService } from '@/lib/services/PageService'
import { createMockPageRepository, createMockWidgetRepository, createMockLoggerService } from '../helpers/mock-factory'
import type { IPageRepository, IWidgetRepository, ILoggerService } from '@/lib/services/interfaces'
import type { Page, PageWithWidgets, CreatePageRequest, UpdatePageRequest } from '@/types/page'
import type { WidgetInstance } from '@/types/widget'

describe('PageService', () => {
  let service: PageService
  let mockPageRepository: IPageRepository
  let mockWidgetRepository: IWidgetRepository
  let mockLogger: ILoggerService

  const mockPage: Page = {
    id: 1,
    name: 'Test Page',
    dashboardId: 1,
    snapping: true,
    gridRows: 12,
    gridCols: 12,
    marginTop: 20,
    marginRight: 20,
    marginBottom: 20,
    marginLeft: 20
  }

  const mockWidget: WidgetInstance = {
    id: 1,
    type: 'clock',
    position: '{"left":"0","top":"0","width":"200","height":"150"}',
    options: '{}',
    pageId: 1
  }

  const mockCreateRequest: CreatePageRequest = {
    name: 'New Page',
    dashboardId: 1,
    snapping: true,
    gridRows: 12,
    gridCols: 12,
    marginTop: 20,
    marginRight: 20,
    marginBottom: 20,
    marginLeft: 20
  }

  const mockUpdateRequest: UpdatePageRequest = {
    name: 'Updated Page',
    snapping: false,
    gridRows: 10,
    gridCols: 10
  }

  beforeEach(() => {
    mockPageRepository = createMockPageRepository()
    mockWidgetRepository = createMockWidgetRepository()
    mockLogger = createMockLoggerService()
    service = new PageService(mockPageRepository, mockWidgetRepository, mockLogger)
  })

  describe('getAllPages', () => {
    it('should return all pages successfully', async () => {
      const mockPages = [mockPage]
      vi.mocked(mockPageRepository.findAll).mockResolvedValue(mockPages)

      const result = await service.getAllPages()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockPages)
      expect(result.total).toBe(1)
      expect(mockPageRepository.findAll).toHaveBeenCalledOnce()
    })

    it('should handle repository errors', async () => {
      const error = new Error('Database error')
      vi.mocked(mockPageRepository.findAll).mockRejectedValue(error)

      const result = await service.getAllPages()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database error')
      expect(mockLogger.error).toHaveBeenCalledWith('Page fetch pages failed', error, {
        module: 'page',
        method: 'fetch pages'
      })
    })
  })

  describe('getPagesByDashboardId', () => {
    it('should return pages by dashboard id successfully', async () => {
      const mockPages = [mockPage]
      vi.mocked(mockPageRepository.findByDashboardId).mockResolvedValue(mockPages)

      const result = await service.getPagesByDashboardId(1)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockPages)
      expect(result.total).toBe(1)
      expect(mockPageRepository.findByDashboardId).toHaveBeenCalledWith(1)
    })

    it('should handle repository errors', async () => {
      const error = new Error('Database error')
      vi.mocked(mockPageRepository.findByDashboardId).mockRejectedValue(error)

      const result = await service.getPagesByDashboardId(1)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database error')
      expect(mockLogger.error).toHaveBeenCalledWith('Page fetch pages by dashboard failed', error, {
        module: 'page',
        method: 'fetch pages by dashboard'
      })
    })
  })

  describe('getPageById', () => {
    it('should return page by id successfully', async () => {
      vi.mocked(mockPageRepository.findById).mockResolvedValue(mockPage)

      const result = await service.getPageById(1)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockPage)
      expect(mockPageRepository.findById).toHaveBeenCalledWith(1)
    })

    it('should return not found when page does not exist', async () => {
      vi.mocked(mockPageRepository.findById).mockResolvedValue(null)

      const result = await service.getPageById(999)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Page with id 999 not found')
      expect(mockLogger.warn).toHaveBeenCalledWith('Page with id 999 not found', { id: 999 }, {
        module: 'page',
        method: 'notFound'
      })
    })

    it('should handle repository errors', async () => {
      const error = new Error('Database error')
      vi.mocked(mockPageRepository.findById).mockRejectedValue(error)

      const result = await service.getPageById(1)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database error')
    })
  })

  describe('getPageWithWidgets', () => {
    it('should return page with widgets successfully', async () => {
      const mockWidgets = [mockWidget]
      const expectedPageWithWidgets: PageWithWidgets = { ...mockPage, widgets: mockWidgets }

      vi.mocked(mockPageRepository.findById).mockResolvedValue(mockPage)
      vi.mocked(mockWidgetRepository.findByPageId).mockResolvedValue(mockWidgets)

      const result = await service.getPageWithWidgets(1)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(expectedPageWithWidgets)
      expect(mockPageRepository.findById).toHaveBeenCalledWith(1)
      expect(mockWidgetRepository.findByPageId).toHaveBeenCalledWith(1)
    })

    it('should return not found when page does not exist', async () => {
      vi.mocked(mockPageRepository.findById).mockResolvedValue(null)

      const result = await service.getPageWithWidgets(999)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Page with id 999 not found')
      expect(mockWidgetRepository.findByPageId).not.toHaveBeenCalled()
    })

    it('should handle repository errors', async () => {
      const error = new Error('Widget fetch error')
      vi.mocked(mockPageRepository.findById).mockResolvedValue(mockPage)
      vi.mocked(mockWidgetRepository.findByPageId).mockRejectedValue(error)

      const result = await service.getPageWithWidgets(1)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Widget fetch error')
    })
  })

  describe('createPage', () => {
    it('should create page successfully', async () => {
      vi.mocked(mockPageRepository.findByName).mockResolvedValue(null)
      vi.mocked(mockPageRepository.create).mockResolvedValue(mockPage)

      const result = await service.createPage(mockCreateRequest)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockPage)
      expect(mockPageRepository.findByName).toHaveBeenCalledWith('New Page')
      expect(mockPageRepository.create).toHaveBeenCalledWith(mockCreateRequest)
    })

    it('should handle repository errors during creation', async () => {
      vi.mocked(mockPageRepository.findByName).mockResolvedValue(null)
      vi.mocked(mockPageRepository.create).mockRejectedValue(new Error('Creation failed'))

      const result = await service.createPage(mockCreateRequest)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Creation failed')
    })
  })

  describe('updatePage', () => {
    it('should update page successfully', async () => {
      const updatedPage = { ...mockPage, ...mockUpdateRequest }
      vi.mocked(mockPageRepository.findByName).mockResolvedValue(null)
      vi.mocked(mockPageRepository.update).mockResolvedValue(updatedPage)

      const result = await service.updatePage(1, mockUpdateRequest)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(updatedPage)
      expect(mockPageRepository.update).toHaveBeenCalledWith(1, mockUpdateRequest)
    })

    it('should update page without name validation when name is not provided', async () => {
      const updateWithoutName = { snapping: false }
      const updatedPage = { ...mockPage, snapping: false }
      vi.mocked(mockPageRepository.update).mockResolvedValue(updatedPage)

      const result = await service.updatePage(1, updateWithoutName)

      expect(result.success).toBe(true)
      expect(mockPageRepository.findByName).not.toHaveBeenCalled()
      expect(mockPageRepository.update).toHaveBeenCalledWith(1, updateWithoutName)
    })

    it('should fail when updated name already exists for different page', async () => {
      const existingPage = { ...mockPage, id: 2 }
      vi.mocked(mockPageRepository.findByName).mockResolvedValue(existingPage)

      const result = await service.updatePage(1, mockUpdateRequest)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Page with name "Updated Page" already exists')
      expect(mockPageRepository.update).not.toHaveBeenCalled()
    })

    it('should succeed when updated name exists for the same page', async () => {
      const updatedPage = { ...mockPage, ...mockUpdateRequest }
      vi.mocked(mockPageRepository.findByName).mockResolvedValue({ ...mockPage, name: 'Updated Page' })
      vi.mocked(mockPageRepository.update).mockResolvedValue(updatedPage)

      const result = await service.updatePage(1, mockUpdateRequest)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(updatedPage)
    })
  })

  describe('deletePage', () => {
    it('should delete page successfully', async () => {
      vi.mocked(mockPageRepository.findAll).mockResolvedValue([mockPage, { ...mockPage, id: 2 }])
      vi.mocked(mockPageRepository.delete).mockResolvedValue(true)

      const result = await service.deletePage(1)

      expect(result.success).toBe(true)
      expect(result.data).toBe(true)
      expect(mockPageRepository.delete).toHaveBeenCalledWith(1)
    })

    it('should fail when trying to delete the last page', async () => {
      vi.mocked(mockPageRepository.findAll).mockResolvedValue([mockPage])

      const result = await service.deletePage(1)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Cannot delete the last remaining page')
      expect(mockPageRepository.delete).not.toHaveBeenCalled()
    })

    it('should return not found when page to delete does not exist', async () => {
      vi.mocked(mockPageRepository.findAll).mockResolvedValue([mockPage, { ...mockPage, id: 2 }])
      vi.mocked(mockPageRepository.delete).mockResolvedValue(false)

      const result = await service.deletePage(999)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Page with id 999 not found')
    })
  })

  describe('updateGridSettings', () => {
    it('should update grid settings successfully', async () => {
      const updatedPage = { ...mockPage, gridRows: 10, gridCols: 8, snapping: false }
      vi.mocked(mockPageRepository.updateGridSettings).mockResolvedValue(updatedPage)

      const result = await service.updateGridSettings(1, 10, 8, false)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(updatedPage)
      expect(mockPageRepository.updateGridSettings).toHaveBeenCalledWith(1, 10, 8, false)
    })

    it('should handle repository errors', async () => {
      const error = new Error('Grid update failed')
      vi.mocked(mockPageRepository.updateGridSettings).mockRejectedValue(error)

      const result = await service.updateGridSettings(1, 10, 8, false)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Grid update failed')
    })
  })

  describe('validatePageName', () => {
    it('should validate unique name successfully', async () => {
      vi.mocked(mockPageRepository.findByName).mockResolvedValue(null)

      const result = await service.validatePageName('Unique Name')

      expect(result.success).toBe(true)
      expect(result.data).toBe(true)
    })

    it('should fail for empty name', async () => {
      const result = await service.validatePageName('')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Page name cannot be empty')
      expect(mockPageRepository.findByName).not.toHaveBeenCalled()
    })

    it('should fail for whitespace-only name', async () => {
      const result = await service.validatePageName('   ')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Page name cannot be empty')
    })

    it('should fail for name too long', async () => {
      const longName = 'a'.repeat(256)
      const result = await service.validatePageName(longName)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Page name cannot exceed 255 characters')
    })

    it('should fail for duplicate name', async () => {
      vi.mocked(mockPageRepository.findByName).mockResolvedValue(mockPage)

      const result = await service.validatePageName('Test Page')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Page with name "Test Page" already exists')
    })

    it('should succeed for same page with same name', async () => {
      vi.mocked(mockPageRepository.findByName).mockResolvedValue(mockPage)

      const result = await service.validatePageName('Test Page', 1)

      expect(result.success).toBe(true)
      expect(result.data).toBe(true)
    })
  })
})