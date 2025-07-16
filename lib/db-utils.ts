import { db } from './db'

/**
 * Database utilities for common patterns and optimizations
 */

// Query cache for performance optimization
class QueryCache {
  private static instance: QueryCache
  private cache = new Map<string, any>()
  private readonly maxSize = 100
  
  public static getInstance(): QueryCache {
    if (!QueryCache.instance) {
      QueryCache.instance = new QueryCache()
    }
    return QueryCache.instance
  }
  
  public get<T>(key: string, factory: () => T): T {
    if (this.cache.has(key)) {
      return this.cache.get(key)
    }
    
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    
    const query = factory()
    this.cache.set(key, query)
    return query
  }
  
  public clear(): void {
    this.cache.clear()
  }
  
  public getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys())
    }
  }
}

export const queryCache = QueryCache.getInstance()

// Export database connection for direct access when needed
export { db } from './db'