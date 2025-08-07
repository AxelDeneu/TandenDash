import { describe, it, expect, beforeEach, vi } from 'vitest'
import { WidgetDataService } from '@/lib/services/WidgetDataService'
import { createMockWidgetDataRepository } from '../helpers/mock-factory'
import type { IWidgetDataRepository } from '@/lib/repositories/interfaces'
import type { WidgetData, CreateWidgetDataRequest, UpdateWidgetDataRequest } from '@/lib/repositories/WidgetDataRepository'

describe('WidgetDataService', () => {
  let service: WidgetDataService
  let mockRepository: IWidgetDataRepository

  const mockWidgetData: WidgetData = {
    id: 1,
    widgetInstanceId: 1,
    key: 'settings',
    value: '{"theme":"dark","size":"large"}'
  }

  const mockWidgetDataList: WidgetData[] = [
    mockWidgetData,
    {
      id: 2,
      widgetInstanceId: 1,
      key: 'preferences',
      value: '{"autoRefresh":true}'
    }
  ]

  beforeEach(() => {
    mockRepository = createMockWidgetDataRepository()
    service = new WidgetDataService(mockRepository)
    
    // Mock console.error to avoid noise in tests
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('getAllData', () => {
    it('should return all data for a widget instance', async () => {
      vi.mocked(mockRepository.findByWidgetInstanceId).mockResolvedValue(mockWidgetDataList)

      const result = await service.getAllData(1)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockWidgetDataList)
      expect(result.count).toBe(2)
      expect(mockRepository.findByWidgetInstanceId).toHaveBeenCalledWith(1)
    })

    it('should handle repository errors', async () => {
      const error = new Error('Database error')
      vi.mocked(mockRepository.findByWidgetInstanceId).mockRejectedValue(error)

      const result = await service.getAllData(1)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database error')
      expect(result.data).toEqual([])
      expect(result.count).toBe(0)
      expect(console.error).toHaveBeenCalledWith('Failed to fetch widget data:', error)
    })
  })

  describe('getData', () => {
    it('should return data for a specific key', async () => {
      vi.mocked(mockRepository.findByKey).mockResolvedValue(mockWidgetData)

      const result = await service.getData(1, 'settings')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockWidgetData)
      expect(mockRepository.findByKey).toHaveBeenCalledWith(1, 'settings')
    })

    it('should return null when data does not exist', async () => {
      vi.mocked(mockRepository.findByKey).mockResolvedValue(null)

      const result = await service.getData(1, 'nonexistent')

      expect(result.success).toBe(true)
      expect(result.data).toBeNull()
    })

    it('should handle repository errors', async () => {
      const error = new Error('Database error')
      vi.mocked(mockRepository.findByKey).mockRejectedValue(error)

      const result = await service.getData(1, 'settings')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database error')
      expect(result.data).toBeNull()
      expect(console.error).toHaveBeenCalledWith('Failed to fetch widget data for key settings:', error)
    })
  })

  describe('getValue', () => {
    it('should parse and return JSON value', async () => {
      vi.mocked(mockRepository.findByKey).mockResolvedValue(mockWidgetData)

      const result = await service.getValue<{ theme: string; size: string }>(1, 'settings')

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ theme: 'dark', size: 'large' })
    })

    it('should return raw string when JSON parsing fails', async () => {
      const rawData: WidgetData = { ...mockWidgetData, value: 'not valid json' }
      vi.mocked(mockRepository.findByKey).mockResolvedValue(rawData)

      const result = await service.getValue(1, 'settings')

      expect(result.success).toBe(true)
      expect(result.data).toBe('not valid json')
    })

    it('should return null when data does not exist', async () => {
      vi.mocked(mockRepository.findByKey).mockResolvedValue(null)

      const result = await service.getValue(1, 'nonexistent')

      expect(result.success).toBe(true)
      expect(result.data).toBeNull()
    })

    it('should handle repository errors', async () => {
      const error = new Error('Database error')
      vi.mocked(mockRepository.findByKey).mockRejectedValue(error)

      const result = await service.getValue(1, 'settings')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database error')
      expect(result.data).toBeNull()
    })
  })

  describe('setData', () => {
    it('should set data with object value', async () => {
      const objectValue = { theme: 'light', size: 'small' }
      const expectedRequest: CreateWidgetDataRequest = {
        widgetInstanceId: 1,
        key: 'settings',
        value: JSON.stringify(objectValue)
      }
      
      vi.mocked(mockRepository.upsert).mockResolvedValue(mockWidgetData)

      const result = await service.setData(1, 'settings', objectValue)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockWidgetData)
      expect(mockRepository.upsert).toHaveBeenCalledWith(expectedRequest)
    })

    it('should set data with string value', async () => {
      const stringValue = 'simple string'
      const expectedRequest: CreateWidgetDataRequest = {
        widgetInstanceId: 1,
        key: 'title',
        value: stringValue
      }
      
      vi.mocked(mockRepository.upsert).mockResolvedValue(mockWidgetData)

      const result = await service.setData(1, 'title', stringValue)

      expect(result.success).toBe(true)
      expect(mockRepository.upsert).toHaveBeenCalledWith(expectedRequest)
    })

    it('should handle repository errors', async () => {
      const error = new Error('Upsert failed')
      vi.mocked(mockRepository.upsert).mockRejectedValue(error)

      const result = await service.setData(1, 'settings', { theme: 'dark' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Upsert failed')
      expect(result.data).toBeUndefined()
      expect(console.error).toHaveBeenCalledWith('Failed to set widget data for key settings:', error)
    })
  })

  describe('updateData', () => {
    it('should update data with object value', async () => {
      const objectValue = { theme: 'light' }
      const expectedRequest: UpdateWidgetDataRequest = {
        value: JSON.stringify(objectValue)
      }
      
      vi.mocked(mockRepository.update).mockResolvedValue(mockWidgetData)

      const result = await service.updateData(1, 'settings', objectValue)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockWidgetData)
      expect(mockRepository.update).toHaveBeenCalledWith(1, 'settings', expectedRequest)
    })

    it('should update data with string value', async () => {
      const stringValue = 'new title'
      const expectedRequest: UpdateWidgetDataRequest = {
        value: stringValue
      }
      
      vi.mocked(mockRepository.update).mockResolvedValue(mockWidgetData)

      const result = await service.updateData(1, 'title', stringValue)

      expect(result.success).toBe(true)
      expect(mockRepository.update).toHaveBeenCalledWith(1, 'title', expectedRequest)
    })

    it('should handle repository errors', async () => {
      const error = new Error('Update failed')
      vi.mocked(mockRepository.update).mockRejectedValue(error)

      const result = await service.updateData(1, 'settings', { theme: 'dark' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Update failed')
      expect(result.data).toBeUndefined()
      expect(console.error).toHaveBeenCalledWith('Failed to update widget data for key settings:', error)
    })
  })

  describe('deleteData', () => {
    it('should delete data successfully', async () => {
      vi.mocked(mockRepository.delete).mockResolvedValue(true)

      const result = await service.deleteData(1, 'settings')

      expect(result.success).toBe(true)
      expect(result.data).toBe(true)
      expect(mockRepository.delete).toHaveBeenCalledWith(1, 'settings')
    })

    it('should handle deletion of non-existent data', async () => {
      vi.mocked(mockRepository.delete).mockResolvedValue(false)

      const result = await service.deleteData(1, 'nonexistent')

      expect(result.success).toBe(true)
      expect(result.data).toBe(false)
    })

    it('should handle repository errors', async () => {
      const error = new Error('Delete failed')
      vi.mocked(mockRepository.delete).mockRejectedValue(error)

      const result = await service.deleteData(1, 'settings')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Delete failed')
      expect(result.data).toBe(false)
      expect(console.error).toHaveBeenCalledWith('Failed to delete widget data for key settings:', error)
    })
  })

  describe('deleteAllData', () => {
    it('should delete all data successfully', async () => {
      vi.mocked(mockRepository.deleteAll).mockResolvedValue(true)

      const result = await service.deleteAllData(1)

      expect(result.success).toBe(true)
      expect(result.data).toBe(true)
      expect(mockRepository.deleteAll).toHaveBeenCalledWith(1)
    })

    it('should handle repository errors', async () => {
      const error = new Error('Delete all failed')
      vi.mocked(mockRepository.deleteAll).mockRejectedValue(error)

      const result = await service.deleteAllData(1)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Delete all failed')
      expect(result.data).toBe(false)
      expect(console.error).toHaveBeenCalledWith('Failed to delete all widget data:', error)
    })
  })

  describe('setMultiple', () => {
    it('should set multiple data entries successfully', async () => {
      const multipleData = {
        settings: { theme: 'dark' },
        preferences: { autoRefresh: true },
        title: 'Widget Title'
      }

      vi.mocked(mockRepository.upsert)
        .mockResolvedValueOnce({ ...mockWidgetData, key: 'settings' })
        .mockResolvedValueOnce({ ...mockWidgetData, id: 2, key: 'preferences' })
        .mockResolvedValueOnce({ ...mockWidgetData, id: 3, key: 'title' })

      const result = await service.setMultiple(1, multipleData)

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(3)
      expect(mockRepository.upsert).toHaveBeenCalledTimes(3)
      expect(mockRepository.upsert).toHaveBeenCalledWith({
        widgetInstanceId: 1,
        key: 'settings',
        value: JSON.stringify({ theme: 'dark' })
      })
      expect(mockRepository.upsert).toHaveBeenCalledWith({
        widgetInstanceId: 1,
        key: 'title',
        value: 'Widget Title'
      })
    })

    it('should handle repository errors during batch operation', async () => {
      const multipleData = { settings: { theme: 'dark' } }
      const error = new Error('Upsert failed')
      vi.mocked(mockRepository.upsert).mockRejectedValue(error)

      const result = await service.setMultiple(1, multipleData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Upsert failed')
      expect(result.data).toEqual([])
      expect(console.error).toHaveBeenCalledWith('Failed to set multiple widget data:', error)
    })
  })

  describe('getMultiple', () => {
    it('should get multiple data entries successfully', async () => {
      const keys = ['settings', 'preferences', 'nonexistent']
      
      vi.mocked(mockRepository.findByKey)
        .mockResolvedValueOnce(mockWidgetData)
        .mockResolvedValueOnce({ ...mockWidgetData, key: 'preferences', value: '{"autoRefresh":true}' })
        .mockResolvedValueOnce(null)

      const result = await service.getMultiple(1, keys)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        settings: { theme: 'dark', size: 'large' },
        preferences: { autoRefresh: true }
      })
      expect(mockRepository.findByKey).toHaveBeenCalledTimes(3)
    })

    it('should handle non-JSON values', async () => {
      const keys = ['title']
      
      vi.mocked(mockRepository.findByKey)
        .mockResolvedValueOnce({ ...mockWidgetData, key: 'title', value: 'Simple Title' })

      const result = await service.getMultiple(1, keys)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        title: 'Simple Title'
      })
    })

    it('should handle repository errors', async () => {
      const error = new Error('Find failed')
      vi.mocked(mockRepository.findByKey).mockRejectedValue(error)

      const result = await service.getMultiple(1, ['settings'])

      expect(result.success).toBe(false)
      expect(result.error).toBe('Find failed')
      expect(result.data).toEqual({})
      expect(console.error).toHaveBeenCalledWith('Failed to get multiple widget data:', error)
    })
  })
})