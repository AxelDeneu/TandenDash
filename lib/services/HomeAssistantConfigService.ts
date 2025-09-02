import type { IDashboardSettingsRepository } from '@/lib/repositories/interfaces'
import type { ServiceResult, ILoggerService } from './interfaces'
import { BaseService } from './BaseService'

export interface HomeAssistantConfig {
  instanceUrl: string
  accessToken: string
}

export interface IHomeAssistantConfigService {
  getDashboardConfig(dashboardId: number): Promise<ServiceResult<HomeAssistantConfig>>
  updateDashboardConfig(dashboardId: number, config: HomeAssistantConfig): Promise<ServiceResult<HomeAssistantConfig>>
  testConnection(config: HomeAssistantConfig): Promise<ServiceResult<boolean>>
}

export class HomeAssistantConfigService extends BaseService implements IHomeAssistantConfigService {
  protected readonly entityName = 'HomeAssistantConfig'
  
  constructor(
    private readonly dashboardSettingsRepository: IDashboardSettingsRepository,
    logger?: ILoggerService
  ) {
    super(logger)
  }

  async getDashboardConfig(dashboardId: number): Promise<ServiceResult<HomeAssistantConfig>> {
    try {
      this.logOperation('getDashboardConfig', { dashboardId })
      
      const settings = await this.dashboardSettingsRepository.findByDashboardId(dashboardId)
      
      if (!settings) {
        return {
          success: false,
          error: 'Dashboard settings not found'
        }
      }

      const config: HomeAssistantConfig = {
        instanceUrl: settings.homeAssistantUrl,
        accessToken: settings.homeAssistantToken
      }

      return this.success(config)
    } catch (error) {
      return this.handleError(error, 'get dashboard HomeAssistant config')
    }
  }

  async updateDashboardConfig(dashboardId: number, config: HomeAssistantConfig): Promise<ServiceResult<HomeAssistantConfig>> {
    try {
      this.logOperation('updateDashboardConfig', { dashboardId, hasUrl: !!config.instanceUrl, hasToken: !!config.accessToken })
      
      // Validate config
      if (config.instanceUrl && !this.isValidUrl(config.instanceUrl)) {
        return {
          success: false,
          error: 'Invalid Home Assistant URL'
        }
      }

      const updatedSettings = await this.dashboardSettingsRepository.update(dashboardId, {
        dashboardId,
        homeAssistantUrl: config.instanceUrl,
        homeAssistantToken: config.accessToken
      })

      if (!updatedSettings) {
        return {
          success: false,
          error: 'Failed to update dashboard settings'
        }
      }

      const updatedConfig: HomeAssistantConfig = {
        instanceUrl: updatedSettings.homeAssistantUrl,
        accessToken: updatedSettings.homeAssistantToken
      }

      return this.success(updatedConfig)
    } catch (error) {
      return this.handleError(error, 'update dashboard HomeAssistant config')
    }
  }

  async testConnection(config: HomeAssistantConfig): Promise<ServiceResult<boolean>> {
    try {
      this.logOperation('testConnection', { hasUrl: !!config.instanceUrl, hasToken: !!config.accessToken })
      
      if (!config.instanceUrl || !config.accessToken) {
        return {
          success: false,
          error: 'URL and access token are required'
        }
      }

      // Test connection by calling the Home Assistant API
      const response = await fetch(`${config.instanceUrl}/api/`, {
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        
        // Check if we got a valid Home Assistant API response
        if (data && typeof data === 'object' && 'message' in data) {
          return this.success(true)
        }
      }

      return {
        success: false,
        error: `Connection failed: ${response.status} ${response.statusText}`
      }
    } catch (error) {
      return this.handleError(error, 'test HomeAssistant connection')
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }
}