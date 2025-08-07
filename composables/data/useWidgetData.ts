import { ref, computed, onMounted, readonly, type Ref } from 'vue'
import type { WidgetData } from '@/lib/repositories/WidgetDataRepository'

export interface UseWidgetData {
  // State
  data: Ref<Map<string, any>>
  loading: Ref<boolean>
  error: Ref<Error | null>
  
  // Methods
  get<T = any>(key: string): T | undefined
  set(key: string, value: any): Promise<void>
  setMultiple(data: Record<string, any>): Promise<void>
  remove(key: string): Promise<void>
  clear(): Promise<void>
  refresh(): Promise<void>
  
  // Computed
  keys: Ref<string[]>
  size: Ref<number>
  isEmpty: Ref<boolean>
}

export function useWidgetData(widgetInstanceId: number | undefined): UseWidgetData {
  // Handle undefined widgetInstanceId (e.g., during widget creation)
  if (!widgetInstanceId || widgetInstanceId === 0) {
    console.warn('useWidgetData called without valid widgetInstanceId')
    return {
      data: ref(new Map()),
      loading: readonly(ref(false)),
      error: readonly(ref(null)),
      get: () => undefined,
      set: async () => {},
      setMultiple: async () => {},
      remove: async () => {},
      clear: async () => {},
      refresh: async () => {},
      keys: ref([]),
      size: readonly(ref(0)),
      isEmpty: readonly(ref(true))
    }
  }
  // Local state
  const data = ref<Map<string, any>>(new Map())
  const loading = ref(false)
  const error = ref<Error | null>(null)
  
  // Fetch initial data
  const fetchData = async () => {
    try {
      loading.value = true
      error.value = null
      
      const response = await $fetch<WidgetData[]>(`/api/widgets-instances/${widgetInstanceId}/data`, {
        // Disable cache to always get fresh data
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        // Add timestamp to bypass cache
        query: {
          _t: Date.now()
        }
      })
      
      // Convert array to Map
      const newData = new Map<string, any>()
      for (const item of response) {
        try {
          newData.set(item.key, JSON.parse(item.value))
        } catch {
          // If parsing fails, store as string
          newData.set(item.key, item.value)
        }
      }
      
      data.value = newData
    } catch (err) {
      error.value = err as Error
      console.error('Failed to fetch widget data:', err)
    } finally {
      loading.value = false
    }
  }
  
  // Get a value by key
  const get = <T = any>(key: string): T | undefined => {
    return data.value.get(key) as T | undefined
  }
  
  // Set a single value
  const set = async (key: string, value: any): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      
      // Optimistic update
      data.value.set(key, value)
      
      // Send to server
      await $fetch(`/api/widgets-instances/${widgetInstanceId}/data/${key}`, {
        method: 'PUT',
        body: { value }
      })
    } catch (err) {
      // Revert on error
      data.value.delete(key)
      error.value = err as Error
      console.error('Failed to set widget data:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // Set multiple values at once
  const setMultiple = async (newData: Record<string, any>): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      
      // Optimistic update
      const oldData = new Map(data.value)
      for (const [key, value] of Object.entries(newData)) {
        data.value.set(key, value)
      }
      
      // Send to server
      await $fetch(`/api/widgets-instances/${widgetInstanceId}/data/batch`, {
        method: 'PUT',
        body: newData
      })
    } catch (err) {
      // Revert on error
      data.value = oldData as Map<string, any>
      error.value = err as Error
      console.error('Failed to set multiple widget data:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // Remove a value
  const remove = async (key: string): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      
      // Optimistic update
      const oldValue = data.value.get(key)
      data.value.delete(key)
      
      // Send to server
      await $fetch(`/api/widgets-instances/${widgetInstanceId}/data/${key}`, {
        method: 'DELETE' as 'DELETE'
      })
    } catch (err) {
      // Revert on error
      if (oldValue !== undefined) {
        data.value.set(key, oldValue)
      }
      error.value = err as Error
      console.error('Failed to delete widget data:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // Clear all data
  const clear = async (): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      
      // Get all keys
      const keys = Array.from(data.value.keys())
      
      // Clear locally
      data.value.clear()
      
      // Delete each key on server
      await Promise.all(
        keys.map(key => 
          $fetch(`/api/widgets-instances/${widgetInstanceId}/data/${key}`, {
            method: 'DELETE' as 'DELETE'
          })
        )
      )
    } catch (err) {
      // Refetch on error to restore state
      await fetchData()
      error.value = err as Error
      console.error('Failed to clear widget data:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // Refresh data from server
  const refresh = async (): Promise<void> => {
    await fetchData()
  }
  
  // Computed properties
  const keys = computed(() => Array.from(data.value.keys()))
  const size = computed(() => data.value.size)
  const isEmpty = computed(() => data.value.size === 0)
  
  // Initialize data on mount
  onMounted(() => {
    fetchData()
  })
  
  return {
    // State
    data: data as Ref<Map<string, any>>,
    loading: readonly(loading),
    error: readonly(error),
    
    // Methods
    get,
    set,
    setMultiple,
    remove,
    clear,
    refresh,
    
    // Computed
    keys: keys as Ref<string[]>,
    size: readonly(size),
    isEmpty: readonly(isEmpty)
  }
}

// Helper to create a reactive storage key
export function useWidgetDataKey<T>(
  widgetInstanceId: number,
  key: string,
  defaultValue?: T
): {
  value: Ref<T | undefined>
  loading: Ref<boolean>
  error: Ref<Error | null>
  save: (value: T) => Promise<void>
  remove: () => Promise<void>
} {
  const widgetData = useWidgetData(widgetInstanceId)
  
  const value = computed({
    get: () => widgetData.get<T>(key) ?? defaultValue,
    set: (newValue) => {
      widgetData.set(key, newValue)
    }
  })
  
  const save = async (newValue: T) => {
    await widgetData.set(key, newValue)
  }
  
  const remove = async () => {
    await widgetData.remove(key)
  }
  
  return {
    value,
    loading: widgetData.loading,
    error: widgetData.error,
    save,
    remove
  }
}