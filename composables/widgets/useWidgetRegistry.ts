import { computed } from 'vue'
import type { Component } from 'vue'
import { useWidgetPlugins } from './useWidgetPlugins'

// Bridge interface to maintain compatibility with old WidgetDefinition
export interface WidgetDefinitionCompat {
  name: string
  component: Component
  defaultConfig: Record<string, any>
  configSchema?: any
}

/**
 * Compatibility layer for old widget registry API
 * @deprecated Use useWidgetPlugins instead
 */
export function useWidgetRegistry() {
  const widgetPlugins = useWidgetPlugins()

  /**
   * Get a widget by type (compatible with old API)
   */
  function getWidget(type: string): WidgetDefinitionCompat | undefined {
    const plugin = widgetPlugins.getPlugin(type)
    if (!plugin) return undefined

    // Convert WidgetPluginManifest to WidgetDefinition format
    // Handle both old and new plugin structures
    return {
      name: plugin.metadata.id,
      component: plugin.component || (plugin as any).renderer?.component,
      defaultConfig: plugin.defaultConfig || (plugin as any).configManager?.defaultConfig || {},
      configSchema: plugin.configSchema || (plugin as any).configManager?.schema
    }
  }

  /**
   * Get all available widgets (compatible with old API)
   */
  function getAllWidgets(): WidgetDefinitionCompat[] {
    const plugins = widgetPlugins.getAllPlugins()
    
    return plugins.map(plugin => ({
      name: plugin.metadata.id,
      component: plugin.component || (plugin as any).renderer?.component,
      defaultConfig: plugin.defaultConfig || (plugin as any).configManager?.defaultConfig || {},
      configSchema: plugin.configSchema || (plugin as any).configManager?.schema
    }))
  }

  /**
   * Register a new widget (compatible with old API)
   */
  async function registerWidget(definition: WidgetDefinitionCompat): Promise<boolean> {
    // Convert old format to new plugin manifest
    const manifest = {
      metadata: {
        id: definition.name,
        name: definition.name,
        description: `Widget ${definition.name}`,
        version: '1.0.0',
        author: 'Legacy'
      },
      component: definition.component,
      defaultConfig: definition.defaultConfig,
      configSchema: definition.configSchema
    }

    return await widgetPlugins.registerPlugin(manifest)
  }

  const isInitialized = computed(() => widgetPlugins.isInitialized.value)
  const loading = computed(() => widgetPlugins.loading.value)
  const error = computed(() => widgetPlugins.error.value)

  return {
    // State
    loading,
    error,
    isInitialized,
    
    // Compatibility methods
    getWidget,
    getAllWidgets,
    registerWidget,
    
    // Initialize (delegates to widget plugins)
    ensureInitialized: widgetPlugins.initialize
  }
}