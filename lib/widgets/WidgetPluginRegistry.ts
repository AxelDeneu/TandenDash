import type { 
  IWidgetPluginRegistry, 
  WidgetPluginManifest 
} from './interfaces'
import type { BaseWidgetConfig } from '@/types/widget'

export class WidgetPluginRegistry implements IWidgetPluginRegistry {
  private plugins = new Map<string, WidgetPluginManifest>()
  private categories = new Map<string, Set<string>>()

  register<TConfig extends BaseWidgetConfig>(
    plugin: WidgetPluginManifest<TConfig>
  ): void {
    const { id } = plugin.metadata

    if (this.plugins.has(id)) {
      console.warn(`Widget plugin with id "${id}" is already registered, skipping`)
      return
    }

    if (!this.validatePlugin(plugin)) {
      throw new Error(`Widget plugin "${id}" failed validation`)
    }

    // Register the plugin
    this.plugins.set(id, plugin)

    // Update category index
    const category = plugin.metadata.category
    if (!this.categories.has(category)) {
      this.categories.set(category, new Set())
    }
    this.categories.get(category)!.add(id)

    console.log(`Widget plugin "${id}" registered successfully`)
  }

  unregister(pluginId: string): void {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Widget plugin with id "${pluginId}" is not registered`)
    }

    // Remove from category index
    const category = plugin.metadata.category
    const categoryPlugins = this.categories.get(category)
    if (categoryPlugins) {
      categoryPlugins.delete(pluginId)
      if (categoryPlugins.size === 0) {
        this.categories.delete(category)
      }
    }

    // Remove the plugin
    this.plugins.delete(pluginId)

    console.log(`Widget plugin "${pluginId}" unregistered successfully`)
  }

  getPlugin<TConfig extends BaseWidgetConfig = BaseWidgetConfig>(
    pluginId: string
  ): WidgetPluginManifest<TConfig> | undefined {
    return this.plugins.get(pluginId) as WidgetPluginManifest<TConfig> | undefined
  }

  getAllPlugins(): WidgetPluginManifest[] {
    return Array.from(this.plugins.values())
  }

  getPluginsByCategory(category: string): WidgetPluginManifest[] {
    const pluginIds = this.categories.get(category)
    if (!pluginIds) {
      return []
    }

    return Array.from(pluginIds)
      .map(id => this.plugins.get(id))
      .filter((plugin): plugin is WidgetPluginManifest => plugin !== undefined)
  }

  isRegistered(pluginId: string): boolean {
    return this.plugins.has(pluginId)
  }

  validatePlugin<TConfig extends BaseWidgetConfig>(
    plugin: WidgetPluginManifest<TConfig>
  ): boolean {
    try {
      // Validate metadata
      const { metadata } = plugin
      if (!metadata.id || !metadata.name || !metadata.version) {
        throw new Error('Plugin metadata is incomplete')
      }

      // Validate ID format (alphanumeric with dashes/underscores)
      if (!/^[a-zA-Z0-9_-]+$/.test(metadata.id)) {
        throw new Error('Plugin ID contains invalid characters')
      }

      // Validate version format (semver)
      if (!/^\d+\.\d+\.\d+/.test(metadata.version)) {
        throw new Error('Plugin version must follow semver format')
      }

      // Validate component (check both old and new structure)
      const component = plugin.component || (plugin as any).renderer?.component
      if (!component) {
        throw new Error('Plugin component is required')
      }

      // Validate config schema (check both old and new structure)
      const configSchema = plugin.configSchema || (plugin as any).configManager?.schema
      if (!configSchema) {
        throw new Error('Plugin config schema is required')
      }

      // Validate default config against schema (check both old and new structure)
      const defaultConfig = plugin.defaultConfig || (plugin as any).configManager?.defaultConfig
      try {
        configSchema.parse(defaultConfig)
      } catch (error) {
        throw new Error('Plugin default config does not match schema')
      }

      // Validate dependencies exist
      if (plugin.metadata.dependencies) {
        for (const depId of plugin.metadata.dependencies) {
          if (!this.isRegistered(depId)) {
            console.warn(`Plugin "${metadata.id}" depends on unregistered plugin "${depId}"`)
          }
        }
      }

      return true
    } catch (error) {
      console.error(`Plugin validation failed for "${plugin.metadata.id}":`, error)
      return false
    }
  }

  // Additional utility methods
  getCategories(): string[] {
    return Array.from(this.categories.keys())
  }

  getPluginCount(): number {
    return this.plugins.size
  }

  searchPlugins(query: string): WidgetPluginManifest[] {
    const lowercaseQuery = query.toLowerCase()
    return this.getAllPlugins().filter(plugin => {
      const metadata = plugin.metadata
      return (
        metadata.name.toLowerCase().includes(lowercaseQuery) ||
        metadata.description.toLowerCase().includes(lowercaseQuery) ||
        metadata.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
        metadata.category.toLowerCase().includes(lowercaseQuery)
      )
    })
  }

  clear(): void {
    this.plugins.clear()
    this.categories.clear()
  }
}