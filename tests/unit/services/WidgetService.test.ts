import { describe, it, expect, beforeEach, vi } from 'vitest'
import { WidgetService } from '@/lib/services/WidgetService'
import { createMockWidgetRepository, createMockLoggerService } from '../helpers/mock-factory'
import type { IWidgetRepository, ILoggerService } from '@/lib/services/interfaces'
import type { WidgetInstance, CreateWidgetRequest, UpdateWidgetRequest } from '@/types/widget'

describe('WidgetService', () => {
  let service: WidgetService
  let mockRepository: IWidgetRepository
  let mockLogger: ILoggerService

  const mockWidget: WidgetInstance = {
    id: 1,
    type: 'clock',
    position: '{"left":"0px","top":"0px","width":"200px","height":"150px"}',
    options: '{"format":"24h"}',
    pageId: 1
  }

  const mockParsedWidget = {
    ...mockWidget,
    position: { x: 0, y: 0, width: 200, height: 150 },
    options: { format: '24h' }
  }

  const mockCreateRequest: CreateWidgetRequest = {
    type: 'clock',
    position: '{"left":"0px","top":"0px","width":"200px","height":"150px"}',
    options: '{"format":"24h"}',
    pageId: 1
  }

  const mockUpdateRequest: UpdateWidgetRequest = {
    position: '{"left":"100px","top":"100px","width":"300px","height":"200px"}',
    options: '{"format":"12h"}'
  }

  beforeEach(() => {
    mockRepository = createMockWidgetRepository()
    mockLogger = createMockLoggerService()
    service = new WidgetService(mockRepository, mockLogger)
  })

  describe('getAllWidgets', () => {
    it('should return all widgets successfully', async () => {
      const mockWidgets = [mockWidget]
      vi.mocked(mockRepository.findAll).mockResolvedValue(mockWidgets)

      const result = await service.getAllWidgets()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockWidgets)
      expect(result.total).toBe(1)
      expect(mockRepository.findAll).toHaveBeenCalledOnce()
      expect(mockLogger.debug).toHaveBeenCalledWith('Widget getAllWidgets', { pageId: undefined }, {
        module: 'widget',
        method: 'getAllWidgets'
      })
    })

    it('should return widgets by pageId when provided', async () => {
      const mockWidgets = [mockWidget]
      vi.mocked(mockRepository.findByPageId).mockResolvedValue(mockWidgets)

      const result = await service.getAllWidgets(1)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockWidgets)
      expect(mockRepository.findByPageId).toHaveBeenCalledWith(1)
      expect(mockRepository.findAll).not.toHaveBeenCalled()
    })

    it('should handle repository errors', async () => {
      const error = new Error('Database error')
      vi.mocked(mockRepository.findAll).mockRejectedValue(error)

      const result = await service.getAllWidgets()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database error')
      expect(mockLogger.error).toHaveBeenCalledWith('Widget fetch widgets failed', error, {
        module: 'widget',
        method: 'fetch widgets'
      })
    })
  })

  describe('getWidgetById', () => {
    it('should return widget by id successfully', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(mockWidget)

      const result = await service.getWidgetById(1)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockWidget)
      expect(mockRepository.findById).toHaveBeenCalledWith(1)
    })

    it('should return not found when widget does not exist', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null)

      const result = await service.getWidgetById(999)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Widget with id 999 not found')
      expect(mockLogger.warn).toHaveBeenCalledWith('Widget with id 999 not found', { id: 999 }, {
        module: 'widget',
        method: 'notFound'
      })
    })

    it('should handle repository errors', async () => {
      const error = new Error('Database error')
      vi.mocked(mockRepository.findById).mockRejectedValue(error)

      const result = await service.getWidgetById(1)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database error')
      expect(mockLogger.error).toHaveBeenCalledWith('Widget fetch widget failed', error, {
        module: 'widget',
        method: 'fetch widget'
      })
    })
  })

  describe('createWidget', () => {
    it('should create widget successfully', async () => {
      vi.mocked(mockRepository.create).mockResolvedValue(mockWidget)

      const result = await service.createWidget(mockCreateRequest)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockWidget)
      expect(mockRepository.create).toHaveBeenCalledWith(mockCreateRequest)
      expect(mockLogger.debug).toHaveBeenCalledWith('Widget createWidget', mockCreateRequest, {
        module: 'widget',
        method: 'createWidget'
      })
    })

    it('should handle repository errors during creation', async () => {
      const error = new Error('Creation failed')
      vi.mocked(mockRepository.create).mockRejectedValue(error)

      const result = await service.createWidget(mockCreateRequest)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Creation failed')
      expect(mockLogger.error).toHaveBeenCalledWith('Widget create widget failed', error, {
        module: 'widget',
        method: 'create widget'
      })
    })
  })

  describe('updateWidget', () => {
    it('should update widget successfully', async () => {
      const updatedWidget = { ...mockWidget, ...mockUpdateRequest }
      vi.mocked(mockRepository.update).mockResolvedValue(updatedWidget)

      const result = await service.updateWidget(1, mockUpdateRequest)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(updatedWidget)
      expect(mockRepository.update).toHaveBeenCalledWith(1, mockUpdateRequest)
    })

    it('should handle repository errors during update', async () => {
      const error = new Error('Update failed')
      vi.mocked(mockRepository.update).mockRejectedValue(error)

      const result = await service.updateWidget(1, mockUpdateRequest)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Update failed')
      expect(mockLogger.error).toHaveBeenCalledWith('Widget update widget failed', error, {
        module: 'widget',
        method: 'update widget'
      })
    })
  })

  describe('deleteWidget', () => {
    it('should delete widget successfully', async () => {
      vi.mocked(mockRepository.delete).mockResolvedValue(true)

      const result = await service.deleteWidget(1)

      expect(result.success).toBe(true)
      expect(result.data).toBe(true)
      expect(mockRepository.delete).toHaveBeenCalledWith(1)
    })

    it('should return not found when widget to delete does not exist', async () => {
      vi.mocked(mockRepository.delete).mockResolvedValue(false)

      const result = await service.deleteWidget(999)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Widget with id 999 not found')
    })

    it('should handle repository errors during deletion', async () => {
      const error = new Error('Delete failed')
      vi.mocked(mockRepository.delete).mockRejectedValue(error)

      const result = await service.deleteWidget(1)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Delete failed')
      expect(mockLogger.error).toHaveBeenCalledWith('Widget delete widget failed', error, {
        module: 'widget',
        method: 'delete widget'
      })
    })
  })

  describe('getWidgetsByType', () => {
    it('should return widgets by type successfully', async () => {
      const mockWidgets = [mockWidget]
      vi.mocked(mockRepository.findByType).mockResolvedValue(mockWidgets)

      const result = await service.getWidgetsByType('clock')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockWidgets)
      expect(result.total).toBe(1)
      expect(mockRepository.findByType).toHaveBeenCalledWith('clock')
    })

    it('should handle repository errors', async () => {
      const error = new Error('Find by type failed')
      vi.mocked(mockRepository.findByType).mockRejectedValue(error)

      const result = await service.getWidgetsByType('clock')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Find by type failed')
      expect(mockLogger.error).toHaveBeenCalledWith('Widget fetch widgets by type failed', error, {
        module: 'widget',
        method: 'fetch widgets by type'
      })
    })
  })

  describe('bulkUpdateWidgets', () => {
    it('should bulk update widgets successfully', async () => {
      const bulkUpdates = [
        { id: 1, position: '{"left":"100px","top":"100px","width":"200px","height":"150px"}' },
        { id: 2, options: '{"format":"12h"}' }
      ]
      const updatedWidgets = [mockWidget, { ...mockWidget, id: 2 }]
      vi.mocked(mockRepository.bulkUpdate).mockResolvedValue(updatedWidgets)

      const result = await service.bulkUpdateWidgets(bulkUpdates)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(updatedWidgets)
      expect(result.total).toBe(2)
      expect(mockRepository.bulkUpdate).toHaveBeenCalledWith(bulkUpdates)
      expect(mockLogger.debug).toHaveBeenCalledWith('Widget bulkUpdateWidgets', { count: 2 }, {
        module: 'widget',
        method: 'bulkUpdateWidgets'
      })
    })

    it('should handle repository errors during bulk update', async () => {
      const error = new Error('Bulk update failed')
      const bulkUpdates = [{ id: 1, position: '{"left":"100px","top":"100px","width":"200px","height":"150px"}' }]
      vi.mocked(mockRepository.bulkUpdate).mockRejectedValue(error)

      const result = await service.bulkUpdateWidgets(bulkUpdates)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Bulk update failed')
      expect(mockLogger.error).toHaveBeenCalledWith('Widget bulk update widgets failed', error, {
        module: 'widget',
        method: 'bulk update widgets'
      })
    })
  })

  describe('parseWidgetInstance', () => {
    it('should parse widget instance successfully', () => {
      const result = service.parseWidgetInstance(mockWidget)

      expect(result).toEqual(mockParsedWidget)
    })

    it('should handle invalid position JSON', () => {
      const invalidWidget = {
        ...mockWidget,
        position: 'invalid json'
      }

      const result = service.parseWidgetInstance(invalidWidget)

      expect(result).toEqual({
        ...invalidWidget,
        position: { x: 0, y: 0, width: 200, height: 150 },
        options: {}
      })
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to parse widget instance',
        expect.any(Error),
        {
          module: 'widget',
          method: 'parseWidgetInstance',
          widgetId: 1
        }
      )
    })

    it('should handle invalid options JSON', () => {
      const invalidWidget = {
        ...mockWidget,
        options: 'invalid json'
      }

      const result = service.parseWidgetInstance(invalidWidget)

      expect(result).toEqual({
        ...invalidWidget,
        position: { x: 0, y: 0, width: 200, height: 150 },
        options: {}
      })
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to parse widget instance',
        expect.any(Error),
        {
          module: 'widget',
          method: 'parseWidgetInstance',
          widgetId: 1
        }
      )
    })

    it('should handle invalid position values', () => {
      const invalidWidget = {
        ...mockWidget,
        position: '{"left":"invalidpx","top":"0px","width":"200px","height":"150px"}'
      }

      const result = service.parseWidgetInstance(invalidWidget)

      expect(result.position).toEqual({ x: 0, y: 0, width: 200, height: 150 })
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to parse widget instance',
        expect.any(Error),
        {
          module: 'widget',
          method: 'parseWidgetInstance',
          widgetId: 1
        }
      )
    })
  })
})