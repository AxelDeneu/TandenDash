import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DashboardSettingsService } from '@/lib/services/DashboardSettingsService'
import { createMockDashboardSettingsRepository } from '../helpers/mock-factory'
import type { IDashboardSettingsRepository } from '@/lib/repositories/interfaces'
import type { DashboardSettings, UpdateDashboardSettingsRequest } from '@/types'

describe('DashboardSettingsService', () => {
  let service: DashboardSettingsService
  let mockRepository: IDashboardSettingsRepository

  const mockSettings: DashboardSettings = {
    dashboardId: 1,
    locale: 'en' as const,
    measurementSystem: 'metric' as const,
    temperatureUnit: 'celsius' as const,
    timeFormat: '24h' as const,
    dateFormat: 'DD/MM/YYYY',
    timezone: 'Europe/Paris',
    theme: 'auto' as const
  }

  const mockUpdateRequest: Partial<UpdateDashboardSettingsRequest> = {
    locale: 'fr',
    measurementSystem: 'imperial',
    temperatureUnit: 'fahrenheit',
    timeFormat: '12h',
    theme: 'dark'
  }

  beforeEach(() => {
    mockRepository = createMockDashboardSettingsRepository()
    service = new DashboardSettingsService(mockRepository)
  })

  describe('findByDashboardId', () => {
    it('should return settings when they exist', async () => {
      vi.mocked(mockRepository.findByDashboardId).mockResolvedValue(mockSettings)

      const result = await service.findByDashboardId(1)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockSettings)
      expect(mockRepository.findByDashboardId).toHaveBeenCalledWith(1)
    })

    it('should create settings when they do not exist', async () => {
      vi.mocked(mockRepository.findByDashboardId)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
      vi.mocked(mockRepository.create).mockResolvedValue(mockSettings)

      const result = await service.findByDashboardId(1)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockSettings)
      expect(mockRepository.create).toHaveBeenCalledWith(1)
    })

    it('should handle repository errors', async () => {
      const error = new Error('Database error')
      vi.mocked(mockRepository.findByDashboardId).mockRejectedValue(error)

      const result = await service.findByDashboardId(1)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database error')
    })
  })

  describe('update', () => {
    it('should update settings successfully', async () => {
      const updatedSettings = { ...mockSettings, ...mockUpdateRequest }
      
      vi.mocked(mockRepository.findByDashboardId).mockResolvedValue(mockSettings)
      vi.mocked(mockRepository.update).mockResolvedValue(updatedSettings)

      const result = await service.update(1, mockUpdateRequest)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(updatedSettings)
      expect(mockRepository.update).toHaveBeenCalledWith(1, mockUpdateRequest)
    })

    it('should create settings if they do not exist before updating', async () => {
      const updatedSettings = { ...mockSettings, ...mockUpdateRequest }
      
      vi.mocked(mockRepository.findByDashboardId)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
      vi.mocked(mockRepository.create).mockResolvedValue(mockSettings)
      vi.mocked(mockRepository.update).mockResolvedValue(updatedSettings)

      const result = await service.update(1, mockUpdateRequest)

      expect(result.success).toBe(true)
      expect(mockRepository.create).toHaveBeenCalledWith(1)
      expect(mockRepository.update).toHaveBeenCalledWith(1, mockUpdateRequest)
    })

    it('should validate measurement system', async () => {
      const invalidRequest = { measurementSystem: 'invalid' as any }

      const result = await service.update(1, invalidRequest)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid measurement system. Must be "metric" or "imperial"')
      expect(mockRepository.update).not.toHaveBeenCalled()
    })

    it('should validate temperature unit', async () => {
      const invalidRequest = { temperatureUnit: 'kelvin' as any }

      const result = await service.update(1, invalidRequest)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid temperature unit. Must be "celsius" or "fahrenheit"')
      expect(mockRepository.update).not.toHaveBeenCalled()
    })

    it('should validate time format', async () => {
      const invalidRequest = { timeFormat: 'invalid' as any }

      const result = await service.update(1, invalidRequest)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid time format. Must be "24h" or "12h"')
      expect(mockRepository.update).not.toHaveBeenCalled()
    })

    it('should validate theme', async () => {
      const invalidRequest = { theme: 'blue' as any }

      const result = await service.update(1, invalidRequest)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid theme. Must be "light", "dark", or "auto"')
      expect(mockRepository.update).not.toHaveBeenCalled()
    })

    it('should handle repository update failure', async () => {
      vi.mocked(mockRepository.findByDashboardId).mockResolvedValue(mockSettings)
      vi.mocked(mockRepository.update).mockResolvedValue(null)

      const result = await service.update(1, mockUpdateRequest)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to update dashboard settings')
    })

    it('should handle repository errors during update', async () => {
      const error = new Error('Update failed')
      vi.mocked(mockRepository.findByDashboardId).mockResolvedValue(mockSettings)
      vi.mocked(mockRepository.update).mockRejectedValue(error)

      const result = await service.update(1, mockUpdateRequest)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Update failed')
    })
  })

  describe('ensureSettingsExist', () => {
    it('should return existing settings when they exist', async () => {
      vi.mocked(mockRepository.findByDashboardId).mockResolvedValue(mockSettings)

      const result = await service.ensureSettingsExist(1)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockSettings)
      expect(mockRepository.create).not.toHaveBeenCalled()
    })

    it('should create settings when they do not exist', async () => {
      vi.mocked(mockRepository.findByDashboardId).mockResolvedValue(null)
      vi.mocked(mockRepository.create).mockResolvedValue(mockSettings)

      const result = await service.ensureSettingsExist(1)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockSettings)
      expect(mockRepository.create).toHaveBeenCalledWith(1)
    })

    it('should handle repository errors during creation', async () => {
      const error = new Error('Creation failed')
      vi.mocked(mockRepository.findByDashboardId).mockResolvedValue(null)
      vi.mocked(mockRepository.create).mockRejectedValue(error)

      const result = await service.ensureSettingsExist(1)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Creation failed')
    })

    it('should handle repository errors during find', async () => {
      const error = new Error('Find failed')
      vi.mocked(mockRepository.findByDashboardId).mockRejectedValue(error)

      const result = await service.ensureSettingsExist(1)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Find failed')
    })
  })
})