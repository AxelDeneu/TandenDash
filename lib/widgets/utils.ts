import { widgetCore } from './WidgetCore'

/**
 * Merge widget options with default config
 * This ensures all required fields are present even if they were added after the widget was created
 */
export function mergeWithDefaults(widgetType: string, options: Record<string, any>): Record<string, any> {
  const plugin = widgetCore.getPlugin(widgetType)
  
  if (!plugin || !plugin.defaultConfig) {
    return options
  }
  
  // Deep merge with defaults, preserving existing values
  return {
    ...plugin.defaultConfig,
    ...options
  }
}

/**
 * Get default config for a widget type
 */
export function getWidgetDefaults(widgetType: string): Record<string, any> | null {
  const plugin = widgetCore.getPlugin(widgetType)
  return plugin?.defaultConfig || null
}