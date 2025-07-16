// New simplified widget system exports
export * from './interfaces'
export { WidgetCore, widgetCore } from './WidgetCore'
export type { WidgetPlugin, IDataProvider, WidgetInstance } from './WidgetCore'

// Import widgetCore for internal use in helper functions
import { widgetCore } from './WidgetCore'

// Export supporting classes that are still used
export { WidgetRenderer } from './WidgetRenderer'
export { WidgetConfigManager } from './WidgetConfigManager'
export { WidgetErrorBoundary } from './WidgetErrorBoundary'

// Export singleton getter for compatibility
export function getWidgetSystemInstance() {
  return widgetCore
}

// Helper functions
export function createWidgetInstance(
  pluginId: string,
  config: unknown,
  position?: { x: number; y: number; width: number; height: number }
) {
  return widgetCore.createInstance(pluginId, config, position)
}

export function destroyWidgetInstance(instanceId: string) {
  return widgetCore.destroyInstance(instanceId)
}

export function getWidgetInstance(instanceId: string) {
  return widgetCore.getInstance(instanceId)
}

export function getAllWidgetInstances() {
  return widgetCore.getAllInstances()
}

export function getAvailableWidgets() {
  return widgetCore.getAllPlugins()
}

export function getWidgetsByCategory(category: string) {
  return widgetCore.getPluginsByCategory(category)
}

export function searchWidgets(query: string) {
  return widgetCore.searchPlugins(query)
}

export function isWidgetSystemInitialized() {
  try {
    return widgetCore.getSystemInfo().initialized
  } catch (error) {
    console.warn('Widget system not ready for initialization check:', error)
    return false
  }
}

export async function initializeWidgetSystem() {
  try {
    if (!isWidgetSystemInitialized()) {
      await widgetCore.initialize()
    }
  } catch (error) {
    console.error('Failed to initialize widget system:', error)
    throw error
  }
}

export function getWidgetSystemInfo() {
  try {
    return widgetCore.getSystemInfo()
  } catch (error) {
    console.warn('Failed to get widget system info:', error)
    return {
      initialized: false,
      pluginCount: 0,
      instanceCount: 0,
      errorCount: 0
    }
  }
}

export function performWidgetSystemHealthCheck() {
  try {
    return widgetCore.performHealthCheck()
  } catch (error) {
    console.error('Failed to perform widget system health check:', error)
    return Promise.resolve({
      healthy: false,
      issues: ['Widget system not accessible'],
      recommendations: ['Initialize widget system first']
    })
  }
}