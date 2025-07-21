import type { IDashboardSettingsRepository } from '@/lib/repositories/interfaces'
import type { 
  DashboardSettings, 
  UpdateDashboardSettingsRequest 
} from '@/types'
import type { ServiceResult } from './interfaces'

export interface IDashboardSettingsService {
  findByDashboardId(dashboardId: number): Promise<ServiceResult<DashboardSettings>>
  update(dashboardId: number, data: Partial<UpdateDashboardSettingsRequest>): Promise<ServiceResult<DashboardSettings>>
  ensureSettingsExist(dashboardId: number): Promise<ServiceResult<DashboardSettings>>
}

export class DashboardSettingsService implements IDashboardSettingsService {
  constructor(
    private dashboardSettingsRepository: IDashboardSettingsRepository
  ) {}

  async findByDashboardId(dashboardId: number): Promise<ServiceResult<DashboardSettings>> {
    try {
      const settings = await this.dashboardSettingsRepository.findByDashboardId(dashboardId)
      
      if (!settings) {
        // Auto-create settings if they don't exist
        return await this.ensureSettingsExist(dashboardId)
      }

      return {
        success: true,
        data: settings
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch dashboard settings'
      }
    }
  }

  async update(
    dashboardId: number, 
    data: Partial<UpdateDashboardSettingsRequest>
  ): Promise<ServiceResult<DashboardSettings>> {
    try {
      // Ensure settings exist first
      const existingResult = await this.ensureSettingsExist(dashboardId)
      if (!existingResult.success) {
        return existingResult
      }

      // Validate settings values
      if (data.measurementSystem && !['metric', 'imperial'].includes(data.measurementSystem)) {
        return {
          success: false,
          error: 'Invalid measurement system. Must be "metric" or "imperial"'
        }
      }

      if (data.temperatureUnit && !['celsius', 'fahrenheit'].includes(data.temperatureUnit)) {
        return {
          success: false,
          error: 'Invalid temperature unit. Must be "celsius" or "fahrenheit"'
        }
      }

      if (data.timeFormat && !['24h', '12h'].includes(data.timeFormat)) {
        return {
          success: false,
          error: 'Invalid time format. Must be "24h" or "12h"'
        }
      }

      if (data.theme && !['light', 'dark', 'auto'].includes(data.theme)) {
        return {
          success: false,
          error: 'Invalid theme. Must be "light", "dark", or "auto"'
        }
      }

      const updated = await this.dashboardSettingsRepository.update(dashboardId, data)
      
      if (!updated) {
        return {
          success: false,
          error: 'Failed to update dashboard settings'
        }
      }

      return {
        success: true,
        data: updated
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update dashboard settings'
      }
    }
  }

  async ensureSettingsExist(dashboardId: number): Promise<ServiceResult<DashboardSettings>> {
    try {
      // Check if settings already exist
      let settings = await this.dashboardSettingsRepository.findByDashboardId(dashboardId)
      
      if (!settings) {
        // Create default settings
        settings = await this.dashboardSettingsRepository.create(dashboardId)
      }

      return {
        success: true,
        data: settings
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to ensure dashboard settings exist'
      }
    }
  }
}