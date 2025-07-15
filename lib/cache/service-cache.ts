import { CacheManager } from './cache-manager'
import type { ServiceResult, ServiceListResult } from '~/lib/services/types'

interface ServiceCacheOptions {
  ttl?: number
  tags?: string[]
  invalidateOn?: string[] // Service method names that invalidate this cache
}

/**
 * Decorator for caching service method results
 */
export function CacheResult(options: ServiceCacheOptions = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    
    descriptor.value = async function (...args: any[]) {
      // Get or create cache manager for this service
      if (!this._cache) {
        this._cache = new CacheManager()
      }
      
      // Generate cache key
      const cacheKey = `${propertyName}:${JSON.stringify(args)}`
      
      // Try to get from cache
      const cached = this._cache.get(cacheKey)
      if (cached !== null) {
        return cached
      }
      
      // Execute original method
      const result = await originalMethod.apply(this, args)
      
      // Cache successful results
      if (result.success) {
        this._cache.set(cacheKey, result, {
          ttl: options.ttl,
          tags: options.tags || [propertyName]
        })
      }
      
      return result
    }
    
    return descriptor
  }
}

/**
 * Decorator for invalidating cache on service method execution
 */
export function InvalidatesCache(tags: string[]) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    
    descriptor.value = async function (...args: any[]) {
      // Execute original method
      const result = await originalMethod.apply(this, args)
      
      // Invalidate cache on success
      if (result.success && this._cache) {
        this._cache.invalidateTags(tags)
      }
      
      return result
    }
    
    return descriptor
  }
}

/**
 * Mixin for adding cache to services
 */
export class CacheableService {
  protected _cache: CacheManager
  
  constructor() {
    this._cache = new CacheManager()
  }
  
  protected invalidateCache(tags: string[]): void {
    this._cache.invalidateTags(tags)
  }
  
  protected clearCache(): void {
    this._cache.clear()
  }
  
  protected getCacheStats() {
    return this._cache.getStats()
  }
}