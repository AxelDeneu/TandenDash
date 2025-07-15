// TEMPORARY: Backward compatibility wrapper
// This composable combines useWidgetRegistry and useWidgetPlugins for backward compatibility
// New code should use useWidgetPlugins directly

import { useWidgetRegistry } from './widgets/useWidgetRegistry'
import { useWidgetPlugins } from './widgets/useWidgetPlugins'
import { widgetSystem } from '@/lib/widgets/WidgetSystem'

export function useWidgetSystem() {
  const registry = useWidgetRegistry()
  const plugins = useWidgetPlugins()

  return {
    // State
    loading: registry.loading,
    error: registry.error,
    isInitialized: registry.isInitialized,
    systemInfo: plugins.systemInfo,
    
    // Compatibility API (old useWidgetRegistry)
    getWidget: registry.getWidget,
    getAllWidgets: registry.getAllWidgets,
    registerWidget: registry.registerWidget,
    
    // New API
    ensureInitialized: registry.ensureInitialized,
    getAvailableWidgets: plugins.getAllPlugins,
    getWidgetPlugin: plugins.getPlugin,
    createWidgetInstance: plugins.createInstance,
    destroyWidgetInstance: plugins.destroyInstance,
    
    // Direct access to subsystems (for advanced use)
    registry: widgetSystem.registry,
    instanceManager: widgetSystem.instanceManager,
    errorBoundary: widgetSystem.errorBoundary
  }
}