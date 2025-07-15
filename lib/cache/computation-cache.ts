import { CacheManager } from './cache-manager'

/**
 * Cache for expensive computations
 */
export class ComputationCache {
  private cache: CacheManager
  
  constructor() {
    this.cache = new CacheManager(10 * 60 * 1000) // 10 minutes default
  }
  
  /**
   * Memoize an async function
   */
  memoize<TArgs extends unknown[], TResult>(
    fn: (...args: TArgs) => Promise<TResult>,
    options: {
      ttl?: number
      keyGenerator?: (...args: TArgs) => string
      tags?: string[]
    } = {}
  ): (...args: TArgs) => Promise<TResult> {
    const {
      ttl,
      keyGenerator = (...args) => JSON.stringify(args),
      tags = []
    } = options
    
    return async (...args: TArgs): Promise<TResult> => {
      const key = `memoize:${fn.name}:${keyGenerator(...args)}`
      
      return this.cache.getOrSet(
        key,
        () => fn(...args),
        { ttl, tags }
      )
    }
  }
  
  /**
   * Cache widget calculations
   */
  async cacheWidgetCalculation<T>(
    widgetId: number,
    calculationName: string,
    calculator: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const key = `widget:${widgetId}:calc:${calculationName}`
    
    return this.cache.getOrSet(
      key,
      calculator,
      {
        ttl,
        tags: [`widget:${widgetId}`, 'widget-calculations']
      }
    )
  }
  
  /**
   * Cache grid layout calculations
   */
  async cacheGridLayout<T>(
    pageId: number,
    gridRows: number,
    gridCols: number,
    calculator: () => Promise<T>,
    ttl: number = 5 * 60 * 1000 // 5 minutes
  ): Promise<T> {
    const key = `grid:${pageId}:${gridRows}x${gridCols}`
    
    return this.cache.getOrSet(
      key,
      calculator,
      {
        ttl,
        tags: [`page:${pageId}`, 'grid-layouts']
      }
    )
  }
  
  /**
   * Invalidate widget calculations
   */
  invalidateWidgetCalculations(widgetId: number): void {
    this.cache.invalidateTag(`widget:${widgetId}`)
  }
  
  /**
   * Invalidate page grid layouts
   */
  invalidatePageLayouts(pageId: number): void {
    this.cache.invalidateTag(`page:${pageId}`)
  }
  
  /**
   * Clear all computation caches
   */
  clearAll(): void {
    this.cache.clear()
  }
  
  /**
   * Get cache statistics
   */
  getStats() {
    return this.cache.getStats()
  }
}

// Global computation cache
let globalComputationCache: ComputationCache | null = null

export function getComputationCache(): ComputationCache {
  if (!globalComputationCache) {
    globalComputationCache = new ComputationCache()
  }
  return globalComputationCache
}

// For testing
export function resetComputationCache(): void {
  globalComputationCache = null
}