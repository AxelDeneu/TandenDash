import { ref, watch, type Ref } from 'vue'
import { useWidgetData } from '@/composables/data/useWidgetData'

export interface WidgetStorageOptions {
  widgetInstanceId?: number
  autoSave?: boolean
}

export function useWidgetStorage(options: WidgetStorageOptions = {}) {
  const { widgetInstanceId, autoSave = true } = options
  
  // Use the global widget data composable if widgetInstanceId is provided
  const widgetData = widgetInstanceId ? useWidgetData(widgetInstanceId) : null
  
  // Create a storage interface
  const createStorageRef = <T>(key: string, defaultValue: T): Ref<T> => {
    const valueRef = ref<T>(defaultValue) as Ref<T>
    
    console.log(`[WidgetStorage] Creating storage ref for key: ${key}`)
    
    // Load initial value if available
    if (widgetData) {
      const stored = widgetData.get<T>(key)
      if (stored !== null && stored !== undefined) {
        console.log(`[WidgetStorage] Found initial value for ${key}:`, stored)
        valueRef.value = stored
      } else {
        console.log(`[WidgetStorage] No initial value found for ${key}, using default:`, defaultValue)
      }
      
      // Watch for data changes to load value when it becomes available
      watch(() => widgetData.data.value, (newData) => {
        if (newData.has(key)) {
          const newValue = newData.get(key)
          console.log(`[WidgetStorage] Data loaded for ${key}:`, newValue)
          // Only update if the value is different to avoid triggering auto-save
          if (JSON.stringify(valueRef.value) !== JSON.stringify(newValue)) {
            valueRef.value = newValue as T
          }
        }
      }, { immediate: true })
    }
    
    // Auto-save on change
    if (autoSave && widgetData) {
      watch(valueRef, async (newValue) => {
        try {
          console.log(`[WidgetStorage] Saving ${key}:`, newValue)
          await widgetData.set(key, newValue)
        } catch (error) {
          console.error(`[WidgetStorage] Failed to save ${key}:`, error)
        }
      }, { deep: true })
    }
    
    return valueRef
  }
  
  // Manual save method
  const save = async (key: string, value: any) => {
    if (!widgetData) {
      console.warn('No widgetInstanceId provided, cannot save')
      return
    }
    
    await widgetData.set(key, value)
  }
  
  // Manual load method
  const load = <T>(key: string, defaultValue?: T): T | null => {
    if (!widgetData) {
      console.warn('No widgetInstanceId provided, cannot load')
      return defaultValue || null
    }
    
    const value = widgetData.get<T>(key)
    return value !== null && value !== undefined ? value : (defaultValue ?? null)
  }
  
  // Remove a key
  const remove = async (key: string) => {
    if (!widgetData) {
      console.warn('No widgetInstanceId provided, cannot remove')
      return
    }
    
    await widgetData.remove(key)
  }
  
  // Clear all data
  const clear = async () => {
    if (!widgetData) {
      console.warn('No widgetInstanceId provided, cannot clear')
      return
    }
    
    await widgetData.clear()
  }
  
  return {
    // Methods
    createStorageRef,
    save,
    load,
    remove,
    clear,
    
    // Direct access to widget data if needed
    widgetData
  }
}