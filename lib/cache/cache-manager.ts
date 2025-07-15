interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  tags?: string[]
}

interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  tags?: string[] // Tags for invalidation
}

export class CacheManager {
  private cache = new Map<string, CacheEntry<unknown>>()
  private tagIndex = new Map<string, Set<string>>() // tag -> cache keys
  
  constructor(
    private defaultTTL: number = 5 * 60 * 1000 // 5 minutes default
  ) {
    // Start cleanup interval
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanup(), 60 * 1000) // Cleanup every minute
    }
  }
  
  /**
   * Get a value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined
    
    if (!entry) {
      return null
    }
    
    // Check if expired
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.delete(key)
      return null
    }
    
    return entry.data
  }
  
  /**
   * Set a value in cache
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const ttl = options.ttl ?? this.defaultTTL
    const tags = options.tags ?? []
    
    // Remove old entry if exists
    this.delete(key)
    
    // Add new entry
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      tags
    }
    
    this.cache.set(key, entry)
    
    // Update tag index
    tags.forEach(tag => {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set())
      }
      this.tagIndex.get(tag)!.add(key)
    })
  }
  
  /**
   * Delete a value from cache
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false
    
    // Remove from tag index
    if (entry.tags) {
      entry.tags.forEach(tag => {
        const keys = this.tagIndex.get(tag)
        if (keys) {
          keys.delete(key)
          if (keys.size === 0) {
            this.tagIndex.delete(tag)
          }
        }
      })
    }
    
    return this.cache.delete(key)
  }
  
  /**
   * Invalidate all entries with a specific tag
   */
  invalidateTag(tag: string): number {
    const keys = this.tagIndex.get(tag)
    if (!keys) return 0
    
    let count = 0
    keys.forEach(key => {
      if (this.delete(key)) {
        count++
      }
    })
    
    return count
  }
  
  /**
   * Invalidate all entries with any of the specified tags
   */
  invalidateTags(tags: string[]): number {
    let count = 0
    tags.forEach(tag => {
      count += this.invalidateTag(tag)
    })
    return count
  }
  
  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
    this.tagIndex.clear()
  }
  
  /**
   * Get cache size
   */
  get size(): number {
    return this.cache.size
  }
  
  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []
    
    this.cache.forEach((entry, key) => {
      if (now > entry.timestamp + entry.ttl) {
        keysToDelete.push(key)
      }
    })
    
    keysToDelete.forEach(key => this.delete(key))
  }
  
  /**
   * Get or set pattern with async factory
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = this.get<T>(key)
    if (cached !== null) {
      return cached
    }
    
    const data = await factory()
    this.set(key, data, options)
    return data
  }
  
  /**
   * Get cache statistics
   */
  getStats(): {
    size: number
    tagCount: number
    memoryUsage: number
  } {
    let memoryUsage = 0
    
    this.cache.forEach(entry => {
      // Rough estimate of memory usage
      memoryUsage += JSON.stringify(entry).length * 2 // 2 bytes per character
    })
    
    return {
      size: this.cache.size,
      tagCount: this.tagIndex.size,
      memoryUsage
    }
  }
}

// Global cache instance
let globalCache: CacheManager | null = null

export function getGlobalCache(): CacheManager {
  if (!globalCache) {
    globalCache = new CacheManager()
  }
  return globalCache
}

// For testing
export function resetGlobalCache(): void {
  globalCache = null
}