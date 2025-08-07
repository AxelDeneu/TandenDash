import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DashboardService } from '@/lib/services/DashboardService'
import { 
  createMockDashboardRepository, 
  createMockDashboardSettingsRepository,
  createMockPageRepository 
} from '../helpers/mock-factory'
import type { 
  IDashboardRepository, 
  IDashboardSettingsRepository,
  IPageRepository
} from '@/lib/repositories/interfaces'
import type { Dashboard, DashboardWithRelations, CreateDashboardRequest, UpdateDashboardRequest } from '@/types'

describe('DashboardService', () => {
  let service: DashboardService
  let mockDashboardRepository: IDashboardRepository
  let mockDashboardSettingsRepository: IDashboardSettingsRepository
  let mockPageRepository: IPageRepository

  const mockDashboard: Dashboard = {
    id: 1,
    name: 'Test Dashboard',
    isDefault: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }

  const mockDashboardSettings = {
    dashboardId: 1,
    locale: 'en' as const,
    measurementSystem: 'metric' as const,
    temperatureUnit: 'celsius' as const,
    timeFormat: '24h' as const,
    dateFormat: 'DD/MM/YYYY',
    timezone: 'Europe/Paris',
    theme: 'auto' as const
  }

  const mockPage = {
    id: 1,
    name: 'Test Page',
    dashboardId: 1,
    snapping: true,
    gridRows: 6,
    gridCols: 6,
    marginTop: 10,
    marginRight: 10,
    marginBottom: 10,
    marginLeft: 10
  }

  const mockCreateRequest: CreateDashboardRequest = {
    name: 'New Dashboard',
    isDefault: false,
    settings: {
      locale: 'en',
      measurementSystem: 'metric',
      temperatureUnit: 'celsius',
      timeFormat: '24h',
      dateFormat: 'DD/MM/YYYY',
      timezone: 'Europe/Paris',
      theme: 'auto'
    }
  }

  const mockUpdateRequest: UpdateDashboardRequest = {
    name: 'Updated Dashboard'
  }

  beforeEach(() => {
    mockDashboardRepository = createMockDashboardRepository()
    mockDashboardSettingsRepository = createMockDashboardSettingsRepository()
    mockPageRepository = createMockPageRepository()
    service = new DashboardService(
      mockDashboardRepository,
      mockDashboardSettingsRepository,
      mockPageRepository
    )
  })

  describe('findAll', () => {
    it('should return all dashboards successfully', async () => {
      const mockDashboards = [mockDashboard]
      vi.mocked(mockDashboardRepository.findAll).mockResolvedValue(mockDashboards)

      const result = await service.findAll()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockDashboards)
      expect(result.count).toBe(1)
      expect(mockDashboardRepository.findAll).toHaveBeenCalledOnce()
    })

    it('should handle repository errors', async () => {
      const error = new Error('Database error')
      vi.mocked(mockDashboardRepository.findAll).mockRejectedValue(error)

      const result = await service.findAll()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database error')
      expect(result.data).toEqual([])
      expect(result.count).toBe(0)
    })
  })

  describe('findById', () => {
    it('should return dashboard with relations successfully', async () => {
      const expectedDashboardWithRelations: DashboardWithRelations = {
        ...mockDashboard,
        settings: mockDashboardSettings,
        pages: [mockPage]
      }

      vi.mocked(mockDashboardRepository.findById).mockResolvedValue(mockDashboard)
      vi.mocked(mockDashboardSettingsRepository.findByDashboardId).mockResolvedValue(mockDashboardSettings)
      vi.mocked(mockPageRepository.findByDashboardId).mockResolvedValue([mockPage])

      const result = await service.findById(1)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(expectedDashboardWithRelations)
      expect(mockDashboardRepository.findById).toHaveBeenCalledWith(1)
      expect(mockDashboardSettingsRepository.findByDashboardId).toHaveBeenCalledWith(1)
      expect(mockPageRepository.findByDashboardId).toHaveBeenCalledWith(1)
    })

    it('should return not found when dashboard does not exist', async () => {
      vi.mocked(mockDashboardRepository.findById).mockResolvedValue(null)

      const result = await service.findById(999)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Dashboard with id 999 not found')
    })

    it('should handle dashboard without settings', async () => {
      vi.mocked(mockDashboardRepository.findById).mockResolvedValue(mockDashboard)
      vi.mocked(mockDashboardSettingsRepository.findByDashboardId).mockResolvedValue(null)
      vi.mocked(mockPageRepository.findByDashboardId).mockResolvedValue([mockPage])

      const result = await service.findById(1)

      expect(result.success).toBe(true)
      expect(result.data?.settings).toBeUndefined()
    })
  })

  describe('findDefault', () => {
    it('should return existing default dashboard', async () => {
      vi.mocked(mockDashboardRepository.findDefault).mockResolvedValue(mockDashboard)

      const result = await service.findDefault()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockDashboard)
    })

    it('should set first dashboard as default when no default exists', async () => {
      vi.mocked(mockDashboardRepository.findDefault).mockResolvedValue(null)
      vi.mocked(mockDashboardRepository.findAll).mockResolvedValue([mockDashboard])
      vi.mocked(mockDashboardRepository.setDefault).mockResolvedValue(true)

      const result = await service.findDefault()

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ ...mockDashboard, isDefault: true })
      expect(mockDashboardRepository.setDefault).toHaveBeenCalledWith(1)
    })

    it('should create default dashboard when none exist', async () => {
      const createdDashboard = { 
        ...mockDashboard, 
        name: 'Principal',
        isDefault: true 
      }

      vi.mocked(mockDashboardRepository.findDefault).mockResolvedValue(null)
      vi.mocked(mockDashboardRepository.findAll).mockResolvedValue([])
      vi.mocked(mockDashboardRepository.findByName).mockResolvedValue(null)
      vi.mocked(mockDashboardRepository.create).mockResolvedValue(createdDashboard)
      vi.mocked(mockDashboardSettingsRepository.create).mockResolvedValue(mockDashboardSettings)
      vi.mocked(mockPageRepository.create).mockResolvedValue(mockPage)

      const result = await service.findDefault()

      expect(result.success).toBe(true)
      expect(result.data?.name).toBe('Principal')
      expect(mockDashboardRepository.create).toHaveBeenCalledWith({
        name: 'Principal',
        isDefault: true,
        settings: {
          locale: 'fr',
          measurementSystem: 'metric',
          temperatureUnit: 'celsius',
          timeFormat: '24h',
          dateFormat: 'DD/MM/YYYY',
          timezone: 'Europe/Paris',
          theme: 'auto'
        }
      })
      expect(mockPageRepository.create).toHaveBeenCalledWith({
        name: 'Accueil',
        dashboardId: 1,
        snapping: true,
        gridRows: 6,
        gridCols: 6,
        marginTop: 10,
        marginRight: 10,
        marginBottom: 10,
        marginLeft: 10
      })
    })

    it('should handle creation failure', async () => {
      vi.mocked(mockDashboardRepository.findDefault).mockResolvedValue(null)
      vi.mocked(mockDashboardRepository.findAll).mockResolvedValue([])
      vi.mocked(mockDashboardRepository.findByName).mockResolvedValue(null)
      vi.mocked(mockDashboardRepository.create).mockRejectedValue(new Error('Creation failed'))

      const result = await service.findDefault()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Creation failed')
    })
  })

  describe('create', () => {
    it('should create dashboard successfully', async () => {
      vi.mocked(mockDashboardRepository.findByName).mockResolvedValue(null)
      vi.mocked(mockDashboardRepository.create).mockResolvedValue(mockDashboard)
      vi.mocked(mockDashboardSettingsRepository.create).mockResolvedValue(mockDashboardSettings)

      const result = await service.create(mockCreateRequest)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockDashboard)
      expect(mockDashboardRepository.create).toHaveBeenCalledWith(mockCreateRequest)
      expect(mockDashboardSettingsRepository.create).toHaveBeenCalledWith(
        mockDashboard.id,
        mockCreateRequest.settings
      )
    })

    it('should fail when dashboard name already exists', async () => {
      vi.mocked(mockDashboardRepository.findByName).mockResolvedValue(mockDashboard)

      const result = await service.create(mockCreateRequest)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Dashboard with name "New Dashboard" already exists')
      expect(mockDashboardRepository.create).not.toHaveBeenCalled()
    })

    it('should handle repository errors', async () => {
      vi.mocked(mockDashboardRepository.findByName).mockResolvedValue(null)
      vi.mocked(mockDashboardRepository.create).mockRejectedValue(new Error('Creation failed'))

      const result = await service.create(mockCreateRequest)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Creation failed')
    })
  })

  describe('update', () => {
    it('should update dashboard successfully', async () => {
      const updatedDashboard = { ...mockDashboard, ...mockUpdateRequest }
      vi.mocked(mockDashboardRepository.findById).mockResolvedValue(mockDashboard)
      vi.mocked(mockDashboardRepository.findByName).mockResolvedValue(null)
      vi.mocked(mockDashboardRepository.update).mockResolvedValue(updatedDashboard)

      const result = await service.update(1, mockUpdateRequest)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(updatedDashboard)
      expect(mockDashboardRepository.update).toHaveBeenCalledWith(1, mockUpdateRequest)
    })

    it('should fail when dashboard does not exist', async () => {
      vi.mocked(mockDashboardRepository.findById).mockResolvedValue(null)

      const result = await service.update(999, mockUpdateRequest)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Dashboard with id 999 not found')
      expect(mockDashboardRepository.update).not.toHaveBeenCalled()
    })

    it('should fail when updated name already exists', async () => {
      const otherDashboard = { ...mockDashboard, id: 2 }
      vi.mocked(mockDashboardRepository.findById).mockResolvedValue(mockDashboard)
      vi.mocked(mockDashboardRepository.findByName).mockResolvedValue(otherDashboard)

      const result = await service.update(1, mockUpdateRequest)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Dashboard with name "Updated Dashboard" already exists')
      expect(mockDashboardRepository.update).not.toHaveBeenCalled()
    })

    it('should succeed when same name for same dashboard', async () => {
      const updateRequest = { name: 'Test Dashboard' }
      const updatedDashboard = { ...mockDashboard, ...updateRequest }
      
      vi.mocked(mockDashboardRepository.findById).mockResolvedValue(mockDashboard)
      vi.mocked(mockDashboardRepository.update).mockResolvedValue(updatedDashboard)

      const result = await service.update(1, updateRequest)

      expect(result.success).toBe(true)
      expect(mockDashboardRepository.findByName).not.toHaveBeenCalled()
    })
  })

  describe('delete', () => {
    it('should delete dashboard successfully', async () => {
      const otherDashboard = { ...mockDashboard, id: 2, isDefault: false }
      vi.mocked(mockDashboardRepository.findById).mockResolvedValue(otherDashboard)
      vi.mocked(mockDashboardRepository.findAll).mockResolvedValue([mockDashboard, otherDashboard])
      vi.mocked(mockDashboardRepository.delete).mockResolvedValue(true)

      const result = await service.delete(2)

      expect(result.success).toBe(true)
      expect(result.data).toBe(true)
      expect(mockDashboardRepository.delete).toHaveBeenCalledWith(2)
    })

    it('should fail when dashboard does not exist', async () => {
      vi.mocked(mockDashboardRepository.findById).mockResolvedValue(null)

      const result = await service.delete(999)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Dashboard with id 999 not found')
    })

    it('should fail when trying to delete the last dashboard', async () => {
      vi.mocked(mockDashboardRepository.findById).mockResolvedValue(mockDashboard)
      vi.mocked(mockDashboardRepository.findAll).mockResolvedValue([mockDashboard])

      const result = await service.delete(1)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Cannot delete the last dashboard')
      expect(mockDashboardRepository.delete).not.toHaveBeenCalled()
    })

    it('should set another dashboard as default when deleting default dashboard', async () => {
      const otherDashboard = { ...mockDashboard, id: 2, isDefault: false }
      vi.mocked(mockDashboardRepository.findById).mockResolvedValue(mockDashboard)
      vi.mocked(mockDashboardRepository.findAll).mockResolvedValue([mockDashboard, otherDashboard])
      vi.mocked(mockDashboardRepository.setDefault).mockResolvedValue(true)
      vi.mocked(mockDashboardRepository.delete).mockResolvedValue(true)

      const result = await service.delete(1)

      expect(result.success).toBe(true)
      expect(mockDashboardRepository.setDefault).toHaveBeenCalledWith(2)
      expect(mockDashboardRepository.delete).toHaveBeenCalledWith(1)
    })
  })

  describe('setDefault', () => {
    it('should set dashboard as default successfully', async () => {
      vi.mocked(mockDashboardRepository.findById).mockResolvedValue(mockDashboard)
      vi.mocked(mockDashboardRepository.setDefault).mockResolvedValue(true)

      const result = await service.setDefault(1)

      expect(result.success).toBe(true)
      expect(result.data).toBe(true)
      expect(mockDashboardRepository.setDefault).toHaveBeenCalledWith(1)
    })

    it('should fail when dashboard does not exist', async () => {
      vi.mocked(mockDashboardRepository.findById).mockResolvedValue(null)

      const result = await service.setDefault(999)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Dashboard with id 999 not found')
      expect(mockDashboardRepository.setDefault).not.toHaveBeenCalled()
    })
  })

  describe('duplicateDashboard', () => {
    it('should duplicate dashboard successfully', async () => {
      const sourceDashboard: DashboardWithRelations = {
        ...mockDashboard,
        settings: mockDashboardSettings,
        pages: [mockPage]
      }
      const newDashboard = { ...mockDashboard, id: 2, name: 'Duplicated Dashboard', isDefault: false }

      vi.mocked(mockDashboardRepository.findById).mockResolvedValue(mockDashboard)
      vi.mocked(mockDashboardSettingsRepository.findByDashboardId).mockResolvedValue(mockDashboardSettings)
      vi.mocked(mockPageRepository.findByDashboardId).mockResolvedValue([mockPage])
      vi.mocked(mockDashboardRepository.findByName).mockResolvedValue(null)
      vi.mocked(mockDashboardRepository.create).mockResolvedValue(newDashboard)
      vi.mocked(mockPageRepository.create).mockResolvedValue({ ...mockPage, id: 2, dashboardId: 2 })

      const result = await service.duplicateDashboard(1, 'Duplicated Dashboard')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(newDashboard)
      expect(mockDashboardRepository.create).toHaveBeenCalledWith({
        name: 'Duplicated Dashboard',
        isDefault: false,
        settings: {
          locale: 'en',
          measurementSystem: 'metric',
          temperatureUnit: 'celsius',
          timeFormat: '24h',
          dateFormat: 'DD/MM/YYYY',
          timezone: 'Europe/Paris',
          theme: 'auto'
        }
      })
      expect(mockPageRepository.create).toHaveBeenCalledWith({
        name: 'Test Page',
        dashboardId: 2,
        snapping: true,
        gridRows: 6,
        gridCols: 6,
        marginTop: 10,
        marginRight: 10,
        marginBottom: 10,
        marginLeft: 10
      })
    })

    it('should fail when source dashboard does not exist', async () => {
      vi.mocked(mockDashboardRepository.findById).mockResolvedValue(null)

      const result = await service.duplicateDashboard(999, 'New Name')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Dashboard with id 999 not found')
    })

    it('should fail when new name already exists', async () => {
      const sourceDashboard: DashboardWithRelations = {
        ...mockDashboard,
        settings: mockDashboardSettings,
        pages: []
      }

      vi.mocked(mockDashboardRepository.findById).mockResolvedValue(mockDashboard)
      vi.mocked(mockDashboardSettingsRepository.findByDashboardId).mockResolvedValue(mockDashboardSettings)
      vi.mocked(mockPageRepository.findByDashboardId).mockResolvedValue([])
      vi.mocked(mockDashboardRepository.findByName).mockResolvedValue(mockDashboard)

      const result = await service.duplicateDashboard(1, 'Test Dashboard')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Dashboard with name "Test Dashboard" already exists')
    })
  })
})