import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Dashboard, DashboardWithRelations } from '@/types'

// Mock dependencies
const mockFetch = vi.fn()
globalThis.$fetch = mockFetch as any

const mockPush = vi.fn()
vi.mock('#app', () => ({
  useRouter: () => ({
    push: mockPush
  }),
  useNuxtApp: () => ({
    $fetch: mockFetch,
    $logger: {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    }
  })
}))

vi.mock('@vueuse/core', () => ({
  useAsyncState: vi.fn((fn, initial, options) => ({
    execute: vi.fn().mockImplementation(fn)
  }))
}))

const mockLogger = {
  info: vi.fn(),
  error: vi.fn()
}

vi.mock('@/composables', () => ({
  useComposableContext: () => ({}),
  useLogger: () => mockLogger
}))

describe('useDashboard Composable', () => {
  let useDashboard: any

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Dynamic import to ensure fresh module
    const module = await import('@/composables/data/useDashboard')
    useDashboard = module.useDashboard
  })

  describe('initialization', () => {
    it('should initialize with empty state', () => {
      const dashboard = useDashboard()

      expect(dashboard.dashboards.value).toEqual([])
      expect(dashboard.currentDashboard.value).toBeNull()
      expect(dashboard.loading.value).toBe(false)
      expect(dashboard.error.value).toBeNull()
      expect(dashboard.isLoading.value).toBe(false)
      expect(dashboard.hasError.value).toBe(false)
      expect(dashboard.dashboardCount.value).toBe(0)
    })

    it('should provide all required methods', () => {
      const dashboard = useDashboard()

      expect(typeof dashboard.initialize).toBe('function')
      expect(typeof dashboard.fetchDashboards).toBe('function')
      expect(typeof dashboard.fetchDashboard).toBe('function')
      expect(typeof dashboard.createDashboard).toBe('function')
      expect(typeof dashboard.updateDashboard).toBe('function')
      expect(typeof dashboard.deleteDashboard).toBe('function')
      expect(typeof dashboard.switchDashboard).toBe('function')
    })
  })

  describe('fetchDashboards', () => {
    it('should fetch dashboards successfully', async () => {
      const mockDashboards: Dashboard[] = [
        { id: 1, name: 'Dashboard 1', isDefault: true, createdAt: new Date(), updatedAt: new Date() },
        { id: 2, name: 'Dashboard 2', isDefault: false, createdAt: new Date(), updatedAt: new Date() }
      ]
      
      mockFetch.mockResolvedValue(mockDashboards)
      
      const dashboard = useDashboard()
      const result = await dashboard.fetchDashboards()

      expect(mockFetch).toHaveBeenCalledWith('/api/dashboards')
      expect(dashboard.dashboards.value).toEqual(mockDashboards)
      expect(dashboard.dashboardCount.value).toBe(2)
      expect(mockLogger.info).toHaveBeenCalledWith('Dashboards loaded', { count: 2 })
      expect(result).toEqual(mockDashboards)
    })

    it('should handle fetch errors', async () => {
      const error = new Error('API Error')
      mockFetch.mockRejectedValue(error)
      
      const dashboard = useDashboard()
      
      await expect(dashboard.fetchDashboards()).rejects.toThrow('API Error')
      expect(dashboard.error.value).toBe('API Error')
      expect(dashboard.hasError.value).toBe(true)
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to load dashboards', error)
    })
  })

  describe('fetchDashboard', () => {
    it('should fetch single dashboard successfully', async () => {
      const mockDashboard: DashboardWithRelations = {
        id: 1,
        name: 'Test Dashboard',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        pages: [],
        settings: null
      }
      
      mockFetch.mockResolvedValue(mockDashboard)
      
      const dashboard = useDashboard()
      const result = await dashboard.fetchDashboard(1)

      expect(mockFetch).toHaveBeenCalledWith('/api/dashboards/1')
      expect(dashboard.currentDashboard.value).toEqual(mockDashboard)
      expect(dashboard.currentDashboardId.value).toBe(1)
      expect(mockLogger.info).toHaveBeenCalledWith('Dashboard loaded', { id: 1, name: 'Test Dashboard' })
      expect(result).toEqual(mockDashboard)
    })

    it('should handle fetch single dashboard errors', async () => {
      const error = new Error('Dashboard not found')
      mockFetch.mockRejectedValue(error)
      
      const dashboard = useDashboard()
      
      await expect(dashboard.fetchDashboard(999)).rejects.toThrow('Dashboard not found')
      expect(dashboard.error.value).toBe('Dashboard not found')
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to load dashboard', error, { id: 999 })
    })
  })

  describe('createDashboard', () => {
    it('should create dashboard successfully', async () => {
      const newDashboard: Dashboard = {
        id: 3,
        name: 'New Dashboard',
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      mockFetch
        .mockResolvedValueOnce(newDashboard) // Create response
        .mockResolvedValueOnce([newDashboard]) // Refresh list
      
      const dashboard = useDashboard()
      const result = await dashboard.createDashboard({ name: 'New Dashboard' })

      expect(mockFetch).toHaveBeenCalledWith('/api/dashboards', {
        method: 'POST',
        body: { name: 'New Dashboard' }
      })
      expect(mockLogger.info).toHaveBeenCalledWith('Dashboard created', { id: 3, name: 'New Dashboard' })
      expect(result).toEqual(newDashboard)
    })

    it('should handle create errors', async () => {
      const error = new Error('Creation failed')
      mockFetch.mockRejectedValue(error)
      
      const dashboard = useDashboard()
      
      await expect(dashboard.createDashboard({ name: 'Test' })).rejects.toThrow('Creation failed')
      expect(dashboard.error.value).toBe('Creation failed')
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to create dashboard', error)
    })
  })

  describe('switchDashboard', () => {
    it('should switch dashboard successfully', async () => {
      const targetDashboard: DashboardWithRelations = {
        id: 2,
        name: 'Target Dashboard',
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        pages: [],
        settings: null
      }
      
      mockFetch.mockResolvedValue(targetDashboard)
      mockPush.mockResolvedValue(undefined)
      
      const dashboard = useDashboard()
      await dashboard.switchDashboard(2)

      expect(mockFetch).toHaveBeenCalledWith('/api/dashboards/2')
      expect(mockPush).toHaveBeenCalledWith('/dashboard/2')
      expect(dashboard.currentDashboard.value).toEqual(targetDashboard)
      expect(mockLogger.info).toHaveBeenCalledWith('Switched to dashboard', { id: 2 })
    })

    it('should handle switch errors', async () => {
      const error = new Error('Switch failed')
      mockFetch.mockRejectedValue(error)
      
      const dashboard = useDashboard()
      
      await expect(dashboard.switchDashboard(999)).rejects.toThrow('Switch failed')
      expect(dashboard.error.value).toBe('Switch failed')
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to switch dashboard', error, { id: 999 })
    })
  })

  describe('computed properties', () => {
    it('should compute loading state correctly', () => {
      const dashboard = useDashboard()
      
      expect(dashboard.isLoading.value).toBe(false)
      
      // Simulate loading
      dashboard.loading.value = true
      expect(dashboard.isLoading.value).toBe(true)
    })

    it('should compute error state correctly', () => {
      const dashboard = useDashboard()
      
      expect(dashboard.hasError.value).toBe(false)
      
      dashboard.error.value = 'Test error'
      expect(dashboard.hasError.value).toBe(true)
    })

    it('should compute dashboard count correctly', () => {
      const dashboard = useDashboard()
      
      expect(dashboard.dashboardCount.value).toBe(0)
      
      dashboard.dashboards.value = [
        { id: 1, name: 'Test', isDefault: true, createdAt: new Date(), updatedAt: new Date() }
      ]
      expect(dashboard.dashboardCount.value).toBe(1)
    })

    it('should compute current dashboard ID correctly', () => {
      const dashboard = useDashboard()
      
      expect(dashboard.currentDashboardId.value).toBeUndefined()
      
      dashboard.currentDashboard.value = {
        id: 5,
        name: 'Test',
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        pages: [],
        settings: null
      }
      expect(dashboard.currentDashboardId.value).toBe(5)
    })
  })

  describe('loading state management', () => {
    it('should manage loading state during operations', async () => {
      mockFetch.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve([]), 100)))
      
      const dashboard = useDashboard()
      
      expect(dashboard.loading.value).toBe(false)
      
      const promise = dashboard.fetchDashboards()
      expect(dashboard.loading.value).toBe(true)
      
      await promise
      expect(dashboard.loading.value).toBe(false)
    })

    it('should ensure loading is false even on errors', async () => {
      mockFetch.mockRejectedValue(new Error('Test error'))
      
      const dashboard = useDashboard()
      
      try {
        await dashboard.fetchDashboards()
      } catch {
        // Expected to throw
      }
      
      expect(dashboard.loading.value).toBe(false)
    })
  })

  describe('error handling', () => {
    it('should clear error on successful operations', async () => {
      const dashboard = useDashboard()
      dashboard.error.value = 'Previous error'
      
      mockFetch.mockResolvedValue([])
      await dashboard.fetchDashboards()
      
      expect(dashboard.error.value).toBeNull()
    })

    it('should handle non-Error exceptions', async () => {
      mockFetch.mockRejectedValue('String error')
      
      const dashboard = useDashboard()
      
      await expect(dashboard.fetchDashboards()).rejects.toBe('String error')
      expect(dashboard.error.value).toBe('Failed to load dashboards')
    })
  })
})