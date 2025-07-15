import { ref, onMounted, onUnmounted } from 'vue'
import type { WidgetInstance } from '~/types/widgets'
import { useWidgetEventBus } from '../events/useWidgetEventBus'

interface UseWidgetEventsOptions {
  widgetId?: number
  onError?: (error: Error) => void
  onDataUpdate?: (data: unknown) => void
  onConfigChange?: (newConfig: unknown, oldConfig: unknown) => void
  onSelected?: () => void
  onDeselected?: () => void
}

/**
 * Composable for widgets to listen to relevant events
 */
export function useWidgetEvents(options: UseWidgetEventsOptions = {}) {
  const eventBus = useWidgetEventBus()
  const isLoading = ref(false)
  const error = ref<Error | null>(null)
  const isSelected = ref(false)
  const isFocused = ref(false)
  
  onMounted(async () => {
    if (!options.widgetId) return
    
    // Widget state events
    await eventBus.on('widget:loading', (widgetId, loading) => {
      if (widgetId === options.widgetId) {
        isLoading.value = loading
      }
    })
    
    await eventBus.on('widget:error', (widgetId, err) => {
      if (widgetId === options.widgetId) {
        error.value = err
        options.onError?.(err)
      }
    })
    
    await eventBus.on('widget:data:updated', (widgetId, data) => {
      if (widgetId === options.widgetId) {
        options.onDataUpdate?.(data)
      }
    })
    
    await eventBus.on('widget:config:changed', (widgetId, newConfig, oldConfig) => {
      if (widgetId === options.widgetId) {
        options.onConfigChange?.(newConfig, oldConfig)
      }
    })
    
    // Widget interaction events
    await eventBus.on('widget:selected', (widgetId) => {
      if (widgetId === options.widgetId) {
        isSelected.value = true
        options.onSelected?.()
      }
    })
    
    await eventBus.on('widget:deselected', (widgetId) => {
      if (widgetId === options.widgetId) {
        isSelected.value = false
        options.onDeselected?.()
      }
    })
    
    await eventBus.on('widget:focused', (widgetId) => {
      if (widgetId === options.widgetId) {
        isFocused.value = true
      }
    })
    
    await eventBus.on('widget:blurred', (widgetId) => {
      if (widgetId === options.widgetId) {
        isFocused.value = false
      }
    })
  })
  
  // Emit events
  const emitError = async (err: Error) => {
    if (options.widgetId) {
      error.value = err
      await eventBus.emit('widget:error', options.widgetId, err)
    }
  }
  
  const emitLoading = async (loading: boolean) => {
    if (options.widgetId) {
      isLoading.value = loading
      await eventBus.emit('widget:loading', options.widgetId, loading)
    }
  }
  
  const emitDataUpdate = async (data: unknown) => {
    if (options.widgetId) {
      await eventBus.emit('widget:data:updated', options.widgetId, data)
    }
  }
  
  const emitSelect = async () => {
    if (options.widgetId) {
      await eventBus.emit('widget:selected', options.widgetId)
    }
  }
  
  const emitDeselect = async () => {
    if (options.widgetId) {
      await eventBus.emit('widget:deselected', options.widgetId)
    }
  }
  
  const emitFocus = async () => {
    if (options.widgetId) {
      await eventBus.emit('widget:focused', options.widgetId)
    }
  }
  
  const emitBlur = async () => {
    if (options.widgetId) {
      await eventBus.emit('widget:blurred', options.widgetId)
    }
  }
  
  return {
    // State
    isLoading,
    error,
    isSelected,
    isFocused,
    
    // Emitters
    emitError,
    emitLoading,
    emitDataUpdate,
    emitSelect,
    emitDeselect,
    emitFocus,
    emitBlur
  }
}