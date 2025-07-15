import type { WidgetPluginManifest, IWidgetPlugin } from './interfaces'
import type { Component } from 'vue'
import type { BaseWidgetConfig } from '@/types/widget'

/**
 * Adapter class to convert between new plugin format (with renderer/configManager structure)
 * and the expected WidgetPluginManifest format
 */
export class WidgetPluginAdapter {
  /**
   * Convert a plugin with the new structure to the expected WidgetPluginManifest format
   */
  static adaptPlugin<TConfig extends BaseWidgetConfig>(
    plugin: any
  ): WidgetPluginManifest<TConfig> {
    // If plugin already has the correct structure, return as-is
    if (plugin.component && plugin.configSchema && plugin.defaultConfig) {
      return plugin as WidgetPluginManifest<TConfig>
    }

    // Convert from new structure to expected structure
    const adapted: WidgetPluginManifest<TConfig> = {
      metadata: plugin.metadata,
      component: plugin.renderer?.component || plugin.component,
      configSchema: plugin.configManager?.schema || plugin.configSchema,
      defaultConfig: plugin.configManager?.defaultConfig || plugin.defaultConfig,
      dataProvider: plugin.dataProvider,
      lifecycle: plugin.lifecycle,
      permissions: plugin.permissions,
      settings: plugin.settings
    }

    return adapted
  }

  /**
   * Create an IWidgetPlugin implementation from a WidgetPluginManifest
   */
  static createPlugin<TConfig extends BaseWidgetConfig>(
    manifest: WidgetPluginManifest<TConfig>
  ): IWidgetPlugin {
    return {
      metadata: manifest.metadata,
      component: manifest.component,
      defaultConfig: manifest.defaultConfig,
      configSchema: manifest.configSchema
    }
  }
}