import type { Component } from 'vue'
import type { ZodSchema } from 'zod'
import type { BaseWidgetConfig } from '@/types/widget'
import { nanoid } from 'nanoid'
import { WidgetRenderer } from './WidgetRenderer'
import { WidgetConfigManager } from './WidgetConfigManager'
import { WidgetErrorBoundary } from './WidgetErrorBoundary'
import { pluginDiscovery } from './PluginDiscovery'

// Simplified interfaces
export interface WidgetPlugin<TConfig extends BaseWidgetConfig = BaseWidgetConfig> {
  id: string
  name: string
  description: string
  version: string
  icon?: string
  category: string
  tags: string[]
  component: Component
  defaultConfig: TConfig
  configSchema: ZodSchema<TConfig>
  dataProvider?: new () => IDataProvider
  permissions?: string[]
  settings?: {
    allowResize: boolean
    allowMove: boolean
    allowDelete: boolean
    allowConfigure: boolean
  }
}

export interface IDataProvider<TData = any> {
  fetch(): Promise<TData>
  refresh(): Promise<TData>
  subscribe?(callback: (data: TData) => void): void
  unsubscribe?(): void
}

export interface WidgetInstance {
  id: string
  pluginId: string
  config: BaseWidgetConfig
  renderer?: WidgetRenderer<any>
  configManager?: WidgetConfigManager<any>
  dataProvider?: IDataProvider
  isLoading: boolean
  hasError: boolean
  error?: Error
  data?: any
  lastUpdated: Date
}

/**
 * Simplified widget core system that combines registry, instance management, and system functionality
 */
export class WidgetCore {
  private static instance: WidgetCore
  private plugins = new Map<string, WidgetPlugin>()
  private instances = new Map<string, WidgetInstance>()
  private categories = new Map<string, Set<string>>()
  private errorBoundary = new WidgetErrorBoundary()
  private isInitialized = false

  private constructor() {}

  static getInstance(): WidgetCore {
    if (!WidgetCore.instance) {
      WidgetCore.instance = new WidgetCore()
    }
    return WidgetCore.instance
  }

  // System methods
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('Widget system is already initialized')
      return
    }

    try {
      // Set pluginDiscovery to use this instance
      pluginDiscovery.setRegistry(this)
      
      // Auto-discover and register built-in plugins
      await pluginDiscovery.discoverPlugins()
      this.isInitialized = true
      console.log(`Widget system initialized with ${this.plugins.size} plugins`)
    } catch (error) {
      console.error('Failed to initialize widget system:', error)
      throw error
    }
  }

  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return
    }

    // Destroy all instances
    for (const [id] of this.instances) {
      await this.destroyInstance(id)
    }

    // Clear all data
    this.plugins.clear()
    this.categories.clear()
    this.errorBoundary.clearAllErrors()
    this.isInitialized = false
  }

  // Plugin registry methods
  register(plugin: WidgetPlugin): void {
    if (this.plugins.has(plugin.id)) {
      console.warn(`Widget plugin "${plugin.id}" is already registered`)
      return
    }

    if (!this.validatePlugin(plugin)) {
      throw new Error(`Widget plugin "${plugin.id}" failed validation`)
    }

    this.plugins.set(plugin.id, plugin)

    // Update category index
    if (!this.categories.has(plugin.category)) {
      this.categories.set(plugin.category, new Set())
    }
    this.categories.get(plugin.category)!.add(plugin.id)

    console.log(`Widget plugin "${plugin.id}" registered successfully`)
  }

  unregister(pluginId: string): void {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Widget plugin "${pluginId}" is not registered`)
    }

    // Destroy all instances of this plugin
    for (const [id, instance] of this.instances) {
      if (instance.pluginId === pluginId) {
        this.destroyInstance(id)
      }
    }

    // Remove from category index
    const categoryPlugins = this.categories.get(plugin.category)
    if (categoryPlugins) {
      categoryPlugins.delete(pluginId)
      if (categoryPlugins.size === 0) {
        this.categories.delete(plugin.category)
      }
    }

    this.plugins.delete(pluginId)
  }

  getPlugin(pluginId: string): WidgetPlugin | undefined {
    return this.plugins.get(pluginId)
  }

  getAllPlugins(): WidgetPlugin[] {
    return Array.from(this.plugins.values())
  }

  getPluginsByCategory(category: string): WidgetPlugin[] {
    const pluginIds = this.categories.get(category)
    if (!pluginIds) return []

    return Array.from(pluginIds)
      .map(id => this.plugins.get(id))
      .filter((plugin): plugin is WidgetPlugin => plugin !== undefined)
  }

  searchPlugins(query: string): WidgetPlugin[] {
    const lowercaseQuery = query.toLowerCase()
    return this.getAllPlugins().filter(plugin => 
      plugin.name.toLowerCase().includes(lowercaseQuery) ||
      plugin.description.toLowerCase().includes(lowercaseQuery) ||
      plugin.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
      plugin.category.toLowerCase().includes(lowercaseQuery)
    )
  }

  // Instance management methods
  async createInstance(pluginId: string, config: unknown, position?: { x: number; y: number; width: number; height: number }): Promise<string> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin "${pluginId}" is not registered`)
    }

    const instanceId = nanoid()
    const instance: WidgetInstance = {
      id: instanceId,
      pluginId,
      config: config as BaseWidgetConfig,
      isLoading: true,
      hasError: false,
      lastUpdated: new Date()
    }

    this.instances.set(instanceId, instance)

    try {
      // Create config manager
      const configManager = new WidgetConfigManager(plugin, config)
      instance.configManager = configManager

      // Validate and get final config
      const validatedConfig = configManager.getConfig()
      instance.config = validatedConfig

      // Create renderer
      const renderer = new WidgetRenderer(plugin, validatedConfig)
      instance.renderer = renderer

      // Create data provider if needed
      if (plugin.dataProvider) {
        try {
          const dataProvider = new plugin.dataProvider()
          instance.dataProvider = dataProvider

          // Subscribe to data updates
          if (dataProvider.subscribe) {
            dataProvider.subscribe((data) => {
              instance.data = data
              instance.lastUpdated = new Date()
            })
          }

          // Initial data fetch
          const initialData = await dataProvider.fetch()
          instance.data = initialData
        } catch (error) {
          console.warn(`Failed to setup data provider for widget "${instanceId}":`, error)
        }
      }

      instance.isLoading = false
      instance.lastUpdated = new Date()

      return instanceId
    } catch (error) {
      instance.hasError = true
      instance.error = error as Error
      instance.isLoading = false
      this.errorBoundary.handleError(error as Error, instanceId)
      throw error
    }
  }

  async destroyInstance(instanceId: string): Promise<void> {
    const instance = this.instances.get(instanceId)
    if (!instance) {
      throw new Error(`Widget instance "${instanceId}" does not exist`)
    }

    try {
      // Cleanup renderer
      if (instance.renderer) {
        instance.renderer.unmount()
      }

      // Cleanup data provider
      if (instance.dataProvider?.unsubscribe) {
        instance.dataProvider.unsubscribe()
      }

      // Remove instance
      this.instances.delete(instanceId)
    } catch (error) {
      console.error(`Failed to destroy widget instance "${instanceId}":`, error)
      throw error
    }
  }

  async updateInstance(instanceId: string, config: unknown): Promise<void> {
    const instance = this.instances.get(instanceId)
    if (!instance) {
      throw new Error(`Widget instance "${instanceId}" does not exist`)
    }

    try {
      if (!instance.configManager) {
        throw new Error(`Config manager not found for instance "${instanceId}"`)
      }

      // Update configuration
      instance.configManager.updateConfig(config)
      const validatedConfig = instance.configManager.getConfig()
      instance.config = validatedConfig

      // Update renderer
      if (instance.renderer) {
        instance.renderer.update(validatedConfig)
      }

      instance.lastUpdated = new Date()
    } catch (error) {
      instance.hasError = true
      instance.error = error as Error
      this.errorBoundary.handleError(error as Error, instanceId)
      throw error
    }
  }

  getInstance(instanceId: string): WidgetInstance | undefined {
    return this.instances.get(instanceId)
  }

  getAllInstances(): WidgetInstance[] {
    return Array.from(this.instances.values())
  }

  getInstancesByPlugin(pluginId: string): WidgetInstance[] {
    return this.getAllInstances().filter(instance => instance.pluginId === pluginId)
  }

  // Utility methods
  getSystemInfo() {
    return {
      initialized: this.isInitialized,
      pluginCount: this.plugins.size,
      instanceCount: this.instances.size,
      errorCount: this.errorBoundary.getErrorCount()
    }
  }

  async performHealthCheck(): Promise<{
    healthy: boolean
    issues: string[]
    recommendations: string[]
  }> {
    const issues: string[] = []
    const recommendations: string[] = []

    if (!this.isInitialized) {
      issues.push('Widget system is not initialized')
      return { healthy: false, issues, recommendations }
    }

    const errorCount = this.errorBoundary.getErrorCount()
    if (errorCount > 0) {
      issues.push(`${errorCount} widget instances have errors`)
      recommendations.push('Review error logs and attempt recovery')
    }

    if (this.plugins.size === 0) {
      issues.push('No plugins registered')
      recommendations.push('Register at least one widget plugin')
    }

    return { healthy: issues.length === 0, issues, recommendations }
  }

  private validatePlugin(plugin: WidgetPlugin): boolean {
    try {
      // Basic validation
      if (!plugin.id || !plugin.name || !plugin.version) {
        throw new Error('Plugin metadata is incomplete')
      }

      if (!/^[a-zA-Z0-9_-]+$/.test(plugin.id)) {
        throw new Error('Plugin ID contains invalid characters')
      }

      if (!/^\d+\.\d+\.\d+/.test(plugin.version)) {
        throw new Error('Plugin version must follow semver format')
      }

      if (!plugin.component) {
        throw new Error('Plugin component is required')
      }

      if (!plugin.configSchema) {
        throw new Error('Plugin config schema is required')
      }

      // Validate default config against schema
      plugin.configSchema.parse(plugin.defaultConfig)

      return true
    } catch (error) {
      console.error(`Plugin validation failed:`, error)
      return false
    }
  }
}

// Export singleton instance
export const widgetCore = WidgetCore.getInstance()