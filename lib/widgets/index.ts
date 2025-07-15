// Widget system exports
export * from './interfaces'
export { WidgetSystem, widgetSystem } from './WidgetSystem'
export { WidgetPluginRegistry } from './WidgetPluginRegistry'
export { WidgetInstanceManager } from './WidgetInstanceManager'
export { WidgetFactory } from './WidgetFactory'
export { WidgetRenderer } from './WidgetRenderer'
export { WidgetConfigManager } from './WidgetConfigManager'
export { WidgetErrorBoundary } from './WidgetErrorBoundary'
export { WidgetPluginLoader } from './WidgetPluginLoader'
export { WidgetValidationSystem } from './WidgetValidationSystem'

// Built-in widget plugins
export { ClockWidgetPlugin } from './plugins/ClockWidgetPlugin'
export { WeatherWidgetPlugin } from './plugins/WeatherWidgetPlugin'
export { CalendarWidgetPlugin } from './plugins/CalendarWidgetPlugin'
export { NoteWidgetPlugin } from './plugins/NoteWidgetPlugin'
export { TimerWidgetPlugin } from './plugins/TimerWidgetPlugin'

// Helper functions
export function createWidgetInstance(
  pluginId: string,
  config: unknown,
  position?: { x: number; y: number; width: number; height: number }
) {
  return widgetSystem.instanceManager.createInstance(pluginId, config, position)
}

export function destroyWidgetInstance(instanceId: string) {
  return widgetSystem.instanceManager.destroyInstance(instanceId)
}

export function getWidgetInstance(instanceId: string) {
  return widgetSystem.instanceManager.getInstance(instanceId)
}

export function getAllWidgetInstances() {
  return widgetSystem.instanceManager.getAllInstances()
}

export function getAvailableWidgets() {
  return widgetSystem.registry.getAllPlugins()
}

export function getWidgetsByCategory(category: string) {
  return widgetSystem.registry.getPluginsByCategory(category)
}

export function searchWidgets(query: string) {
  return widgetSystem.registry.searchPlugins(query)
}

export function isWidgetSystemInitialized() {
  return widgetSystem.getSystemInfo().initialized
}

export async function initializeWidgetSystem() {
  if (!isWidgetSystemInitialized()) {
    await widgetSystem.initialize()
  }
}

export function getWidgetSystemInfo() {
  return widgetSystem.getSystemInfo()
}

export function performWidgetSystemHealthCheck() {
  return widgetSystem.performHealthCheck()
}