import { ref, readonly } from 'vue'
import type { Ref } from 'vue'

interface UseCacheOptions {
  ttl?: number
  key?: string
  tags?: string[]
}

interface UseCacheReturn<T> {
  data: Readonly<Ref<T | null>>
  loading: Readonly<Ref<boolean>>
  error: Readonly<Ref<Error | null>>
  fetch: (force?: boolean) => Promise<T>
  invalidate: () => void
  clear: () => void
}

/**
 * Composable for client-side caching
 */
export function useCache<T>(
  fetcher: () => Promise<T>,
  options: UseCacheOptions = {}
): UseCacheReturn<T> {
  const data = ref<T | null>(null)
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const lastFetch = ref<number>(0)
  
  const {
    ttl = 5 * 60 * 1000, // 5 minutes default
    key,
    tags = []
  } = options
  
  // Generate cache key if not provided
  const cacheKey = key || `cache:${fetcher.toString()}`
  
  async function fetch(force = false): Promise<T> {
    // Check if we have valid cached data
    if (!force && data.value !== null && Date.now() - lastFetch.value < ttl) {
      return data.value
    }
    
    loading.value = true
    error.value = null
    
    try {
      const result = await fetcher()
      data.value = result
      lastFetch.value = Date.now()
      
      // Store in sessionStorage if key is provided
      if (key && typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(cacheKey, JSON.stringify({
          data: result,
          timestamp: lastFetch.value,
          tags
        }))
      }
      
      return result
    } catch (err) {
      error.value = err as Error
      throw err
    } finally {
      loading.value = false
    }
  }
  
  function invalidate(): void {
    data.value = null
    lastFetch.value = 0
    
    if (key && typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(cacheKey)
    }
  }
  
  function clear(): void {
    invalidate()
  }
  
  // Load from sessionStorage on mount
  if (key && typeof sessionStorage !== 'undefined') {
    const stored = sessionStorage.getItem(cacheKey)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (Date.now() - parsed.timestamp < ttl) {
          data.value = parsed.data
          lastFetch.value = parsed.timestamp
        }
      } catch (err) {
        // Invalid stored data, ignore
      }
    }
  }
  
  return {
    data: readonly(data),
    loading: readonly(loading),
    error: readonly(error),
    fetch,
    invalidate,
    clear
  }
}

/**
 * Global cache invalidation by tags
 */
export function useGlobalCacheInvalidation() {
  function invalidateByTags(tags: string[]): void {
    if (typeof sessionStorage === 'undefined') return
    
    const keysToRemove: string[] = []
    
    // Find all cache entries with matching tags
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (!key || !key.startsWith('cache:')) continue
      
      try {
        const stored = sessionStorage.getItem(key)
        if (!stored) continue
        
        const parsed = JSON.parse(stored)
        if (parsed.tags && parsed.tags.some((tag: string) => tags.includes(tag))) {
          keysToRemove.push(key)
        }
      } catch (err) {
        // Invalid entry, skip
      }
    }
    
    // Remove matched entries
    keysToRemove.forEach(key => sessionStorage.removeItem(key))
  }
  
  function clearAllCache(): void {
    if (typeof sessionStorage === 'undefined') return
    
    const keysToRemove: string[] = []
    
    // Find all cache entries
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key && key.startsWith('cache:')) {
        keysToRemove.push(key)
      }
    }
    
    // Remove all cache entries
    keysToRemove.forEach(key => sessionStorage.removeItem(key))
  }
  
  return {
    invalidateByTags,
    clearAllCache
  }
}