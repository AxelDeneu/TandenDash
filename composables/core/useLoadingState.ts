import { ref, computed } from 'vue'
import type { LoadingState } from './interfaces'

export function useLoadingState(): LoadingState {
  const loadingStates = ref(new Set<string>())
  
  const isLoading = computed(() => loadingStates.value.size > 0)

  function setLoading(loading: boolean, key = 'default'): void {
    if (loading) {
      loadingStates.value.add(key)
    } else {
      loadingStates.value.delete(key)
    }
  }

  async function withLoading<T>(
    operation: () => Promise<T>,
    key = 'default'
  ): Promise<T> {
    setLoading(true, key)
    try {
      const result = await operation()
      return result
    } finally {
      setLoading(false, key)
    }
  }

  function clearLoading(): void {
    loadingStates.value.clear()
  }

  function getLoadingKeys(): string[] {
    return Array.from(loadingStates.value)
  }

  function isLoadingKey(key: string): boolean {
    return loadingStates.value.has(key)
  }

  return {
    isLoading,
    setLoading,
    withLoading,
    clearLoading,
    getLoadingKeys,
    isLoadingKey
  } as LoadingState & {
    clearLoading(): void
    getLoadingKeys(): string[]
    isLoadingKey(key: string): boolean
  }
}