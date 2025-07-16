import { widgetValidationRegistry } from '../validation'
import type { WidgetCore } from './WidgetCore'

export interface PluginDiscoveryOptions {
  /**
   * Directory to search for plugins
   */
  pluginDirectory?: string
  /**
   * File extensions to look for
   */
  extensions?: string[]
}

export class PluginDiscovery {
  private pluginDirectory: string
  private extensions: string[]
  private loadedPlugins: Map<string, any> = new Map()
  private registry: WidgetCore | null = null

  constructor(options: PluginDiscoveryOptions = {}) {
    this.pluginDirectory = options.pluginDirectory || '/lib/widgets/plugins'
    this.extensions = options.extensions || ['.ts', '.js']
  }

  /**
   * Set the widget registry to use
   */
  setRegistry(registry: WidgetCore): void {
    this.registry = registry
  }

  /**
   * Discover and load all widget plugins
   */
  async discoverPlugins(): Promise<void> {
    if (process.server) {
      // Only run discovery on server-side
      await this.loadPluginsFromDirectory()
    } else {
      // On client-side, use static imports to avoid bundling issues
      await this.discoverPluginsClient()
    }
  }

  /**
   * Client-side plugin discovery using static imports
   */
  async discoverPluginsClient(): Promise<void> {
    try {
      // Use import.meta.glob for automatic discovery of all widget plugins
      const pluginModules = import.meta.glob('../../widgets/*/plugin.ts', { eager: true }) as Record<string, any>
      
      console.log('Found plugin modules:', Object.keys(pluginModules))
      
      for (const [path, module] of Object.entries(pluginModules)) {
        try {
          // Extract widget name from directory structure
          const match = path.match(/widgets\/([A-Za-z]+)\/plugin\.ts$/)
          if (!match) continue
          
          const widgetName = match[1]
          const pluginExportName = `${widgetName}WidgetPlugin`
          
          // Get the named export
          const plugin = module[pluginExportName]
          
          if (plugin && plugin.id) {
            // Plugin is already in new format, register directly
            if (this.registry) {
              this.registry.register(plugin)
            }
            if (plugin.configSchema) {
              widgetValidationRegistry.registerSchema(plugin.id, plugin.configSchema)
            }
            console.log(`Auto-discovered widget: ${plugin.id}`)
          } else {
            console.warn(`Plugin ${pluginExportName} not found in module ${path}`)
          }
        } catch (error) {
          console.error(`Failed to load plugin from ${path}:`, error)
        }
      }
      
      const pluginCount = this.registry ? this.registry.getAllPlugins().length : 0
      console.log(`Client-side plugin discovery completed. Found ${pluginCount} plugins`)
    } catch (error) {
      console.error('Failed to discover plugins on client-side:', error)
    }
  }

  /**
   * Load plugins from the configured directory
   */
  private async loadPluginsFromDirectory(): Promise<void> {
    try {
      // Server-side plugin discovery would go here
      // For now, we use the same client-side discovery
      await this.discoverPluginsClient()
    } catch (error) {
      console.error('Failed to load plugins from directory:', error)
    }
  }


  /**
   * Register a single plugin
   */
  async register(pluginPath: string): Promise<void> {
    try {
      const plugin = await import(/* @vite-ignore */ pluginPath)
      const pluginManifest = plugin.default || plugin

      if (pluginManifest && pluginManifest.id) {
        // Plugin is already in new format, register directly
        if (this.registry) {
          this.registry.register(pluginManifest)
        }
        
        // Register validation schema if provided
        if (pluginManifest.configSchema) {
          widgetValidationRegistry.registerSchema(pluginManifest.id, pluginManifest.configSchema)
        }

        this.loadedPlugins.set(pluginManifest.id, pluginManifest)
        console.log(`Registered plugin: ${pluginManifest.id}`)
      } else {
        console.warn(`Invalid plugin manifest at ${pluginPath}`)
      }
    } catch (error) {
      console.error(`Failed to register plugin at ${pluginPath}:`, error)
    }
  }

  /**
   * Unregister a plugin
   */
  unregister(widgetType: string): void {
    if (this.loadedPlugins.has(widgetType)) {
      if (this.registry) {
        this.registry.unregister(widgetType)
      }
      this.loadedPlugins.delete(widgetType)
      console.log(`Unregistered plugin: ${widgetType}`)
    }
  }

  /**
   * Get all loaded plugins
   */
  getLoadedPlugins(): Map<string, any> {
    return new Map(this.loadedPlugins)
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.loadedPlugins.clear()
  }
}

// Export singleton instance
export const pluginDiscovery = new PluginDiscovery()