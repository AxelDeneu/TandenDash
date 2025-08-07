import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ModeService } from '@/lib/services/ModeService'
import { createMockModeStateRepository, createMockLoggerService } from '../helpers/mock-factory'
import type { IModeStateRepository, ILoggerService } from '@/lib/services/interfaces'

describe('ModeService', () => {
  let service: ModeService
  let mockRepository: IModeStateRepository
  let mockLogger: ILoggerService

  beforeEach(() => {
    mockRepository = createMockModeStateRepository()
    mockLogger = createMockLoggerService()
    service = new ModeService(mockRepository, mockLogger)
  })

  describe('getCurrentMode', () => {
    it('should return current mode successfully', async () => {
      vi.mocked(mockRepository.getCurrentMode).mockResolvedValue('dark')

      const result = await service.getCurrentMode()

      expect(result.success).toBe(true)
      expect(result.data).toBe('dark')
      expect(mockRepository.getCurrentMode).toHaveBeenCalledOnce()
      expect(mockLogger.debug).toHaveBeenCalledWith('Mode getCurrentMode', undefined, {
        module: 'mode',
        method: 'getCurrentMode'
      })
    })

    it('should handle repository errors', async () => {
      const error = new Error('Database error')
      vi.mocked(mockRepository.getCurrentMode).mockRejectedValue(error)

      const result = await service.getCurrentMode()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database error')
      expect(mockLogger.error).toHaveBeenCalledWith('Mode get current mode failed', error, {
        module: 'mode',
        method: 'get current mode'
      })
    })
  })

  describe('setMode', () => {
    it('should set mode to light successfully', async () => {
      vi.mocked(mockRepository.setMode).mockResolvedValue(undefined)

      const result = await service.setMode('light')

      expect(result.success).toBe(true)
      expect(result.data).toBeUndefined()
      expect(mockRepository.setMode).toHaveBeenCalledWith('light')
      expect(mockLogger.debug).toHaveBeenCalledWith('Mode setMode', { mode: 'light' }, {
        module: 'mode',
        method: 'setMode'
      })
    })

    it('should set mode to dark successfully', async () => {
      vi.mocked(mockRepository.setMode).mockResolvedValue(undefined)

      const result = await service.setMode('dark')

      expect(result.success).toBe(true)
      expect(result.data).toBeUndefined()
      expect(mockRepository.setMode).toHaveBeenCalledWith('dark')
    })

    it('should handle repository errors', async () => {
      const error = new Error('Set mode failed')
      vi.mocked(mockRepository.setMode).mockRejectedValue(error)

      const result = await service.setMode('light')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Set mode failed')
      expect(mockLogger.error).toHaveBeenCalledWith('Mode set mode failed', error, {
        module: 'mode',
        method: 'set mode'
      })
    })
  })

  describe('toggleMode', () => {
    it('should toggle from light to dark successfully', async () => {
      vi.mocked(mockRepository.getCurrentMode).mockResolvedValue('light')
      vi.mocked(mockRepository.setMode).mockResolvedValue(undefined)

      const result = await service.toggleMode()

      expect(result.success).toBe(true)
      expect(result.data).toBe('dark')
      expect(mockRepository.getCurrentMode).toHaveBeenCalledOnce()
      expect(mockRepository.setMode).toHaveBeenCalledWith('dark')
      expect(mockLogger.info).toHaveBeenCalledWith('Mode toggled', { from: 'light', to: 'dark' }, {
        module: 'mode',
        method: 'toggleMode'
      })
    })

    it('should toggle from dark to light successfully', async () => {
      vi.mocked(mockRepository.getCurrentMode).mockResolvedValue('dark')
      vi.mocked(mockRepository.setMode).mockResolvedValue(undefined)

      const result = await service.toggleMode()

      expect(result.success).toBe(true)
      expect(result.data).toBe('light')
      expect(mockRepository.getCurrentMode).toHaveBeenCalledOnce()
      expect(mockRepository.setMode).toHaveBeenCalledWith('light')
      expect(mockLogger.info).toHaveBeenCalledWith('Mode toggled', { from: 'dark', to: 'light' }, {
        module: 'mode',
        method: 'toggleMode'
      })
    })

    it('should handle errors during getCurrentMode', async () => {
      const error = new Error('Get current mode failed')
      vi.mocked(mockRepository.getCurrentMode).mockRejectedValue(error)

      const result = await service.toggleMode()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Get current mode failed')
      expect(mockRepository.setMode).not.toHaveBeenCalled()
    })

    it('should handle errors during setMode', async () => {
      vi.mocked(mockRepository.getCurrentMode).mockResolvedValue('light')
      const error = new Error('Set mode failed')
      vi.mocked(mockRepository.setMode).mockRejectedValue(error)

      const result = await service.toggleMode()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Set mode failed')
      expect(mockRepository.getCurrentMode).toHaveBeenCalledOnce()
      expect(mockRepository.setMode).toHaveBeenCalledWith('dark')
    })
  })
})