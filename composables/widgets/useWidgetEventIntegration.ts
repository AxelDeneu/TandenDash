import { onMounted, onUnmounted } from 'vue'
import type { WidgetInstance } from '~/types/widgets'
import { useWidgetEventBus } from '../events/useWidgetEventBus'

/**
 * Example composable showing how to integrate event bus in widgets
 * This demonstrates cross-widget communication patterns
 */
export function useWidgetEventIntegration(widgetInstance: WidgetInstance) {
  const eventBus = useWidgetEventBus()
  
  onMounted(async () => {
    // Listen for other widgets on the same page
    await eventBus.on('widget:created', (newWidget) => {
      if (newWidget.pageId === widgetInstance.pageId && newWidget.id !== widgetInstance.id) {
        console.log(`New widget added to page: ${newWidget.type}`)
        // Widget can react to new widgets being added
      }
    })
    
    // Listen for widgets being deleted
    await eventBus.on('widget:deleted', (widgetId) => {
      console.log(`Widget ${widgetId} was deleted`)
      // Widget can react to other widgets being deleted
    })
    
    // Listen for theme changes
    await eventBus.on('theme:changed', (isDark) => {
      console.log(`Theme changed to ${isDark ? 'dark' : 'light'}`)
      // Widget can adapt to theme changes
    })
    
    // Listen for edit mode changes
    await eventBus.on('editMode:changed', (isEditMode) => {
      console.log(`Edit mode: ${isEditMode ? 'enabled' : 'disabled'}`)
      // Widget can show/hide edit controls
    })
    
    // Listen for page changes
    await eventBus.on('page:changed', (pageId) => {
      if (pageId === widgetInstance.pageId) {
        console.log('Current page became active')
        // Widget can refresh data when page becomes active
      }
    })
    
    // Example: Widget-to-widget communication
    // A weather widget could emit temperature updates
    if (widgetInstance.type === 'weather') {
      const emitWeatherUpdate = async (temperature: number) => {
        await eventBus.emit('widget:data:updated', widgetInstance.id, {
          type: 'weather',
          temperature,
          timestamp: Date.now()
        })
      }
      
      // Simulate weather updates
      const interval = setInterval(() => {
        const temp = Math.round(Math.random() * 30 + 10)
        emitWeatherUpdate(temp)
      }, 60000) // Every minute
      
      onUnmounted(() => clearInterval(interval))
    }
    
    // Example: Clock widget could listen to weather updates
    if (widgetInstance.type === 'clock') {
      await eventBus.on('widget:data:updated', (widgetId, data) => {
        if (typeof data === 'object' && data !== null && 'type' in data && data.type === 'weather') {
          console.log(`Clock widget received weather update: ${(data as any).temperature}°C`)
          // Clock widget could display temperature alongside time
        }
      })
    }
  })
  
  // Helper to emit widget-specific events
  const emitWidgetEvent = {
    loading: (isLoading: boolean) => eventBus.emit('widget:loading', widgetInstance.id, isLoading),
    error: (error: Error) => eventBus.emit('widget:error', widgetInstance.id, error),
    dataUpdate: (data: unknown) => eventBus.emit('widget:data:updated', widgetInstance.id, data),
    selected: () => eventBus.emit('widget:selected', widgetInstance.id),
    deselected: () => eventBus.emit('widget:deselected', widgetInstance.id),
    focused: () => eventBus.emit('widget:focused', widgetInstance.id),
    blurred: () => eventBus.emit('widget:blurred', widgetInstance.id)
  }
  
  return {
    emitWidgetEvent
  }
}