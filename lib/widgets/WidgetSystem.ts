import type { 
  IWidgetSystem,
  IWidgetPluginRegistry,
  IWidgetInstanceManager,
  IWidgetFactory,
  IWidgetErrorBoundary,
  IWidgetPluginLoader
} from './interfaces'
import { WidgetPluginRegistry } from './WidgetPluginRegistry'
import { WidgetInstanceManager } from './WidgetInstanceManager'
import { WidgetFactory } from './WidgetFactory'
import { WidgetErrorBoundary } from './WidgetErrorBoundary'
import { WidgetPluginLoader } from './WidgetPluginLoader'
import { WidgetValidationSystem } from './WidgetValidationSystem'

// Import built-in plugins
import { ClockWidgetPlugin } from './plugins/ClockWidgetPlugin'
import { WeatherWidgetPlugin } from './plugins/WeatherWidgetPlugin'
import { CalendarWidgetPlugin } from './plugins/CalendarWidgetPlugin'
import { NoteWidgetPlugin } from './plugins/NoteWidgetPlugin'
import { TimerWidgetPlugin } from './plugins/TimerWidgetPlugin'

export class WidgetSystem implements IWidgetSystem {
  private static instance: WidgetSystem
  private isInitialized = false
  private isHotReloadEnabled = false
  private validationSystem: WidgetValidationSystem

  public readonly registry: IWidgetPluginRegistry
  public readonly instanceManager: IWidgetInstanceManager
  public readonly factory: IWidgetFactory
  public readonly errorBoundary: IWidgetErrorBoundary
  public readonly loader: IWidgetPluginLoader

  private constructor() {
    this.registry = new WidgetPluginRegistry()
    this.factory = new WidgetFactory()
    this.errorBoundary = new WidgetErrorBoundary()
    this.loader = new WidgetPluginLoader(this.registry)
    this.instanceManager = new WidgetInstanceManager(
      this.registry,
      this.factory,
      this.errorBoundary
    )
    this.validationSystem = WidgetValidationSystem.getInstance()
  }

  static getInstance(): WidgetSystem {
    if (!WidgetSystem.instance) {
      WidgetSystem.instance = new WidgetSystem()
    }
    return WidgetSystem.instance
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('Widget system is already initialized')
      return
    }

    try {
      // Initializing widget system...

      // Register built-in plugins
      await this.registerBuiltInPlugins()

      // Load external plugins if any
      await this.loadExternalPlugins()

      this.isInitialized = true
      // Widget system initialized successfully

      // Log system status
      this.logSystemStatus()

    } catch (error) {
      console.error('Failed to initialize widget system:', error)
      throw error
    }
  }

  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return
    }

    try {
      console.log('Shutting down widget system...')

      // Destroy all instances
      const instances = this.instanceManager.getAllInstances()
      for (const instance of instances) {
        try {
          await this.instanceManager.destroyInstance(instance.id)
        } catch (error) {
          console.error(`Failed to destroy instance ${instance.id}:`, error)
        }
      }

      // Disable hot reload
      this.disableHotReload()

      // Clear registrations
      this.registry.clear()
      this.errorBoundary.clearAllErrors()
      this.validationSystem.clearCache()

      this.isInitialized = false
      console.log('Widget system shut down successfully')

    } catch (error) {
      console.error('Error during widget system shutdown:', error)
      throw error
    }
  }

  async installPlugin(pluginPath: string): Promise<void> {
    try {
      const plugin = await this.loader.loadPlugin(pluginPath)
      
      // Validate plugin
      const validation = this.validationSystem.validatePluginManifest(plugin)
      if (!validation.isValid) {
        throw new Error(`Plugin validation failed: ${validation.errors.join(', ')}`)
      }

      // Security check
      const security = this.validationSystem.validateSecurity(plugin)
      if (!security.isSecure) {
        console.warn(`Security concerns for plugin ${plugin.metadata.id}:`, security.risks)
      }

      this.registry.register(plugin)
      console.log(`Plugin ${plugin.metadata.id} installed successfully`)

    } catch (error) {
      console.error(`Failed to install plugin from ${pluginPath}:`, error)
      throw error
    }
  }

  async uninstallPlugin(pluginId: string): Promise<void> {
    try {
      // Destroy all instances of this plugin
      const instances = this.instanceManager.getInstancesByPlugin(pluginId)
      for (const instance of instances) {
        await this.instanceManager.destroyInstance(instance.id)
      }

      // Unload and unregister
      await this.loader.unloadPlugin(pluginId)
      this.registry.unregister(pluginId)

      console.log(`Plugin ${pluginId} uninstalled successfully`)

    } catch (error) {
      console.error(`Failed to uninstall plugin ${pluginId}:`, error)
      throw error
    }
  }

  enableHotReload(): void {
    if (this.isHotReloadEnabled) {
      return
    }

    this.isHotReloadEnabled = true
    // Hot reload enabled for widget plugins

    // In a real implementation, you'd set up file watchers here
    // For now, this is just a placeholder
  }

  disableHotReload(): void {
    if (!this.isHotReloadEnabled) {
      return
    }

    this.isHotReloadEnabled = false
    // Hot reload disabled for widget plugins
  }

  // Additional utility methods
  getSystemInfo(): {
    initialized: boolean
    hotReloadEnabled: boolean
    pluginCount: number
    instanceCount: number
    errorCount: number
  } {
    return {
      initialized: this.isInitialized,
      hotReloadEnabled: this.isHotReloadEnabled,
      pluginCount: this.registry.getPluginCount(),
      instanceCount: this.instanceManager.getAllInstances().length,
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

    // Check if system is initialized
    if (!this.isInitialized) {
      issues.push('Widget system is not initialized')
      return { healthy: false, issues, recommendations }
    }

    // Check for errors
    const errorCount = this.errorBoundary.getErrorCount()
    if (errorCount > 0) {
      issues.push(`${errorCount} widget instances have errors`)
      recommendations.push('Review error logs and attempt recovery')
    }

    // Check plugin performance
    const plugins = this.registry.getAllPlugins()
    for (const plugin of plugins) {
      const performance = this.validationSystem.validatePerformance(plugin)
      if (performance.score < 70) {
        issues.push(`Plugin ${plugin.metadata.id} has performance issues`)
        recommendations.push(...performance.suggestions)
      }
    }

    const healthy = issues.length === 0

    return { healthy, issues, recommendations }
  }

  private async registerBuiltInPlugins(): Promise<void> {
    const builtInPlugins = [
      ClockWidgetPlugin,
      WeatherWidgetPlugin,
      CalendarWidgetPlugin,
      NoteWidgetPlugin,
      TimerWidgetPlugin
    ]

    for (const plugin of builtInPlugins) {
      try {
        const validation = this.validationSystem.validatePluginManifest(plugin)
        if (!validation.isValid) {
          console.error(`Built-in plugin ${plugin.metadata.id} validation failed:`, validation.errors)
          continue
        }

        this.registry.register(plugin)
        console.log(`Built-in plugin ${plugin.metadata.id} registered`)
      } catch (error) {
        console.error(`Failed to register built-in plugin ${plugin.metadata.id}:`, error)
      }
    }
  }

  private async loadExternalPlugins(): Promise<void> {
    // In a real implementation, you'd scan for external plugins here
    // This is a placeholder for future plugin discovery functionality
    console.log('Scanning for external plugins...')
  }

  private logSystemStatus(): void {
    const info = this.getSystemInfo()
    console.log('Widget System Status:', {
      initialized: info.initialized,
      plugins: info.pluginCount,
      instances: info.instanceCount,
      errors: info.errorCount,
      hotReload: info.hotReloadEnabled
    })
  }
}

// Export singleton instance
export const widgetSystem = WidgetSystem.getInstance()