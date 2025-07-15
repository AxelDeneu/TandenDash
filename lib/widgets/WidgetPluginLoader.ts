import type { 
  IWidgetPluginLoader,
  IWidgetPluginRegistry,
  WidgetPluginManifest
} from './interfaces'

export class WidgetPluginLoader implements IWidgetPluginLoader {
  private loadedPlugins = new Set<string>()
  private pluginCache = new Map<string, WidgetPluginManifest>()

  constructor(private readonly registry: IWidgetPluginRegistry) {}

  async loadPlugin(pluginPath: string): Promise<WidgetPluginManifest> {
    try {
      // Validate plugin structure first
      const isValid = await this.validatePluginStructure(pluginPath)
      if (!isValid) {
        throw new Error(`Invalid plugin structure at ${pluginPath}`)
      }

      // Check cache first
      const cached = this.pluginCache.get(pluginPath)
      if (cached) {
        return cached
      }

      // In a real implementation, this would dynamically import the plugin
      // For now, we'll throw an error for external plugins since we only support built-in ones
      throw new Error(`External plugin loading not yet implemented: ${pluginPath}`)

    } catch (error) {
      console.error(`Failed to load plugin from ${pluginPath}:`, error)
      throw error
    }
  }

  async unloadPlugin(pluginId: string): Promise<void> {
    try {
      if (!this.loadedPlugins.has(pluginId)) {
        console.warn(`Plugin ${pluginId} is not loaded`)
        return
      }

      // Remove from cache
      for (const [path, plugin] of this.pluginCache.entries()) {
        if (plugin.metadata.id === pluginId) {
          this.pluginCache.delete(path)
          break
        }
      }

      this.loadedPlugins.delete(pluginId)
      console.log(`Plugin ${pluginId} unloaded successfully`)

    } catch (error) {
      console.error(`Failed to unload plugin ${pluginId}:`, error)
      throw error
    }
  }

  async hotReload(pluginId: string): Promise<void> {
    try {
      if (!this.loadedPlugins.has(pluginId)) {
        throw new Error(`Plugin ${pluginId} is not loaded`)
      }

      // Find the plugin path
      let pluginPath: string | undefined
      for (const [path, plugin] of this.pluginCache.entries()) {
        if (plugin.metadata.id === pluginId) {
          pluginPath = path
          break
        }
      }

      if (!pluginPath) {
        throw new Error(`Plugin path not found for ${pluginId}`)
      }

      // Unload current version
      await this.unloadPlugin(pluginId)
      
      // Unregister from registry
      if (this.registry.isRegistered(pluginId)) {
        this.registry.unregister(pluginId)
      }

      // Reload plugin
      const reloadedPlugin = await this.loadPlugin(pluginPath)
      
      // Re-register
      this.registry.register(reloadedPlugin)

      console.log(`Plugin ${pluginId} hot reloaded successfully`)

    } catch (error) {
      console.error(`Failed to hot reload plugin ${pluginId}:`, error)
      throw error
    }
  }

  getLoadedPlugins(): string[] {
    return Array.from(this.loadedPlugins)
  }

  async validatePluginStructure(pluginPath: string): Promise<boolean> {
    try {
      // In a real implementation, this would check if the plugin file exists
      // and has the correct structure (exports a valid WidgetPluginManifest)
      
      // For now, we'll just check if it's a valid path format
      if (!pluginPath || typeof pluginPath !== 'string') {
        return false
      }

      // Check for common plugin file extensions
      const validExtensions = ['.js', '.ts', '.mjs', '.cjs']
      const hasValidExtension = validExtensions.some(ext => pluginPath.endsWith(ext))
      
      if (!hasValidExtension) {
        console.warn(`Plugin path ${pluginPath} does not have a valid extension`)
        return false
      }

      // Check for suspicious patterns
      if (pluginPath.includes('..') || pluginPath.includes('~')) {
        console.warn(`Plugin path ${pluginPath} contains suspicious patterns`)
        return false
      }

      return true

    } catch (error) {
      console.error(`Error validating plugin structure at ${pluginPath}:`, error)
      return false
    }
  }

  // Additional utility methods
  isPluginLoaded(pluginId: string): boolean {
    return this.loadedPlugins.has(pluginId)
  }

  getPluginPath(pluginId: string): string | undefined {
    for (const [path, plugin] of this.pluginCache.entries()) {
      if (plugin.metadata.id === pluginId) {
        return path
      }
    }
    return undefined
  }

  clearCache(): void {
    this.pluginCache.clear()
    this.loadedPlugins.clear()
  }

  getCacheSize(): number {
    return this.pluginCache.size
  }

  // Development utilities
  async validateAllLoadedPlugins(): Promise<{
    valid: string[]
    invalid: Array<{ pluginId: string; errors: string[] }>
  }> {
    const valid: string[] = []
    const invalid: Array<{ pluginId: string; errors: string[] }> = []

    for (const pluginId of this.loadedPlugins) {
      try {
        const plugin = this.registry.getPlugin(pluginId)
        if (!plugin) {
          invalid.push({ 
            pluginId, 
            errors: ['Plugin not found in registry'] 
          })
          continue
        }

        // Validate plugin structure
        if (plugin.metadata && plugin.component && plugin.configSchema) {
          valid.push(pluginId)
        } else {
          invalid.push({ 
            pluginId, 
            errors: ['Missing required plugin properties'] 
          })
        }

      } catch (error) {
        invalid.push({ 
          pluginId, 
          errors: [error instanceof Error ? error.message : 'Unknown validation error'] 
        })
      }
    }

    return { valid, invalid }
  }
}