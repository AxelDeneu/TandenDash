import type { 
  IDashboardRepository,
  IDashboardSettingsRepository,
  IPageRepository 
} from '@/lib/repositories/interfaces'
import type { 
  Dashboard, 
  DashboardWithRelations,
  CreateDashboardRequest, 
  UpdateDashboardRequest 
} from '@/types'
import type { ServiceResult, ServiceListResult } from './interfaces'

export interface IDashboardService {
  findAll(): Promise<ServiceListResult<Dashboard>>
  findById(id: number): Promise<ServiceResult<DashboardWithRelations>>
  findDefault(): Promise<ServiceResult<Dashboard>>
  create(data: CreateDashboardRequest): Promise<ServiceResult<Dashboard>>
  update(id: number, data: UpdateDashboardRequest): Promise<ServiceResult<Dashboard>>
  delete(id: number): Promise<ServiceResult<boolean>>
  setDefault(id: number): Promise<ServiceResult<boolean>>
  duplicateDashboard(id: number, newName: string): Promise<ServiceResult<Dashboard>>
}

export class DashboardService implements IDashboardService {
  constructor(
    private dashboardRepository: IDashboardRepository,
    private dashboardSettingsRepository: IDashboardSettingsRepository,
    private pageRepository: IPageRepository
  ) {}

  async findAll(): Promise<ServiceListResult<Dashboard>> {
    try {
      const dashboards = await this.dashboardRepository.findAll()
      return {
        success: true,
        data: dashboards,
        count: dashboards.length
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch dashboards',
        data: [],
        count: 0
      }
    }
  }

  async findById(id: number): Promise<ServiceResult<DashboardWithRelations>> {
    try {
      const dashboard = await this.dashboardRepository.findById(id)
      if (!dashboard) {
        return {
          success: false,
          error: `Dashboard with id ${id} not found`
        }
      }

      // Load relations
      const [settings, pages] = await Promise.all([
        this.dashboardSettingsRepository.findByDashboardId(id),
        this.pageRepository.findByDashboardId(id)
      ])

      const dashboardWithRelations: DashboardWithRelations = {
        ...dashboard,
        settings: settings || undefined,
        pages
      }

      return {
        success: true,
        data: dashboardWithRelations
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch dashboard'
      }
    }
  }

  async findDefault(): Promise<ServiceResult<Dashboard>> {
    try {
      const dashboard = await this.dashboardRepository.findDefault()
      if (!dashboard) {
        // If no default dashboard exists, get the first one
        const dashboards = await this.dashboardRepository.findAll()
        if (dashboards.length === 0) {
          // Create a default dashboard if none exist
          const createResult = await this.create({
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
          
          if (!createResult.success || !createResult.data) {
            return {
              success: false,
              error: createResult.error || 'Failed to create default dashboard'
            }
          }
          
          // Also create a default page for this dashboard
          await this.pageRepository.create({
            name: 'Accueil',
            dashboardId: createResult.data.id,
            snapping: true,
            gridRows: 6,
            gridCols: 6,
            marginTop: 10,
            marginRight: 10,
            marginBottom: 10,
            marginLeft: 10
          })
          
          return {
            success: true,
            data: createResult.data
          }
        }
        
        // Set the first dashboard as default
        await this.dashboardRepository.setDefault(dashboards[0].id)
        return {
          success: true,
          data: { ...dashboards[0], isDefault: true }
        }
      }

      return {
        success: true,
        data: dashboard
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch default dashboard'
      }
    }
  }

  async create(data: CreateDashboardRequest): Promise<ServiceResult<Dashboard>> {
    try {
      // Check for duplicate names
      const existing = await this.dashboardRepository.findByName(data.name)
      if (existing) {
        return {
          success: false,
          error: `Dashboard with name "${data.name}" already exists`
        }
      }

      // Create dashboard
      const dashboard = await this.dashboardRepository.create(data)

      // Create default settings
      await this.dashboardSettingsRepository.create(dashboard.id, data.settings)

      return {
        success: true,
        data: dashboard
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create dashboard'
      }
    }
  }

  async update(id: number, data: UpdateDashboardRequest): Promise<ServiceResult<Dashboard>> {
    try {
      // Check if dashboard exists
      const existing = await this.dashboardRepository.findById(id)
      if (!existing) {
        return {
          success: false,
          error: `Dashboard with id ${id} not found`
        }
      }

      // Check for duplicate names if name is being changed
      if (data.name && data.name !== existing.name) {
        const duplicate = await this.dashboardRepository.findByName(data.name)
        if (duplicate) {
          return {
            success: false,
            error: `Dashboard with name "${data.name}" already exists`
          }
        }
      }

      const updated = await this.dashboardRepository.update(id, data)
      if (!updated) {
        return {
          success: false,
          error: 'Failed to update dashboard'
        }
      }

      return {
        success: true,
        data: updated
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update dashboard'
      }
    }
  }

  async delete(id: number): Promise<ServiceResult<boolean>> {
    try {
      // Check if dashboard exists
      const dashboard = await this.dashboardRepository.findById(id)
      if (!dashboard) {
        return {
          success: false,
          error: `Dashboard with id ${id} not found`
        }
      }

      // Prevent deleting the last dashboard
      const allDashboards = await this.dashboardRepository.findAll()
      if (allDashboards.length <= 1) {
        return {
          success: false,
          error: 'Cannot delete the last dashboard'
        }
      }

      // If deleting default dashboard, set another as default
      if (dashboard.isDefault) {
        const otherDashboard = allDashboards.find(d => d.id !== id)
        if (otherDashboard) {
          await this.dashboardRepository.setDefault(otherDashboard.id)
        }
      }

      const deleted = await this.dashboardRepository.delete(id)
      return {
        success: true,
        data: deleted
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete dashboard'
      }
    }
  }

  async setDefault(id: number): Promise<ServiceResult<boolean>> {
    try {
      const dashboard = await this.dashboardRepository.findById(id)
      if (!dashboard) {
        return {
          success: false,
          error: `Dashboard with id ${id} not found`
        }
      }

      const result = await this.dashboardRepository.setDefault(id)
      return {
        success: true,
        data: result
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to set default dashboard'
      }
    }
  }

  async duplicateDashboard(id: number, newName: string): Promise<ServiceResult<Dashboard>> {
    try {
      // Get source dashboard with all relations
      const sourceResult = await this.findById(id)
      if (!sourceResult.success || !sourceResult.data) {
        return {
          success: false,
          error: sourceResult.error || 'Source dashboard not found'
        }
      }

      const source = sourceResult.data

      // Check for duplicate names
      const existing = await this.dashboardRepository.findByName(newName)
      if (existing) {
        return {
          success: false,
          error: `Dashboard with name "${newName}" already exists`
        }
      }

      // Create new dashboard
      const newDashboard = await this.dashboardRepository.create({
        name: newName,
        isDefault: false,
        settings: source.settings ? {
          locale: source.settings.locale,
          measurementSystem: source.settings.measurementSystem,
          temperatureUnit: source.settings.temperatureUnit,
          timeFormat: source.settings.timeFormat,
          dateFormat: source.settings.dateFormat,
          timezone: source.settings.timezone,
          theme: source.settings.theme
        } : undefined
      })

      // Duplicate pages if any exist
      if (source.pages && source.pages.length > 0) {
        for (const page of source.pages) {
          await this.pageRepository.create({
            name: page.name,
            dashboardId: newDashboard.id,
            snapping: page.snapping,
            gridRows: page.gridRows,
            gridCols: page.gridCols,
            marginTop: page.marginTop,
            marginRight: page.marginRight,
            marginBottom: page.marginBottom,
            marginLeft: page.marginLeft
          })
        }
      }

      return {
        success: true,
        data: newDashboard
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to duplicate dashboard'
      }
    }
  }
}