import { db, widgetInstance, todoItem, pages } from './db'
import { eq, asc, placeholder, sql } from 'drizzle-orm'
import type { SQLiteTable } from 'drizzle-orm/sqlite-core'

/**
 * Database utilities for common patterns and optimizations
 */

// Transaction wrapper with retry logic
export async function withTransaction<T>(
  operation: (tx: typeof db) => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await db.transaction(operation)
    } catch (error) {
      lastError = error as Error
      
      // Only retry on specific SQLite errors (BUSY, LOCKED)
      if (
        error instanceof Error && 
        (error.message.includes('SQLITE_BUSY') || error.message.includes('SQLITE_LOCKED'))
      ) {
        console.warn(`Transaction attempt ${attempt} failed, retrying...`, error.message)
        
        // Exponential backoff
        const delay = Math.min(100 * Math.pow(2, attempt - 1), 1000)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      
      // Don't retry for other errors
      throw error
    }
  }
  
  throw lastError || new Error('Transaction failed after maximum retries')
}

// Batch insert with optimized performance
export async function batchInsert<T extends SQLiteTable>(
  table: T,
  data: Record<string, any>[],
  batchSize = 100
): Promise<void> {
  if (data.length === 0) return
  
  const batches = []
  for (let i = 0; i < data.length; i += batchSize) {
    batches.push(data.slice(i, i + batchSize))
  }
  
  await withTransaction(async (tx) => {
    for (const batch of batches) {
      await tx.insert(table).values(batch)
    }
  })
}

// Prepare and cache common queries
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

// Common prepared statements for better performance
export const preparedQueries = {
  // Widget queries
  getWidgetsByPage: queryCache.get('widgets-by-page', () => 
    db.select().from(widgetInstance).where(eq(widgetInstance.pageId, placeholder('pageId'))).prepare()
  ),
  
  getWidgetById: queryCache.get('widget-by-id', () =>
    db.select().from(widgetInstance).where(eq(widgetInstance.id, placeholder('id'))).prepare()
  ),
  
  // Todo queries
  getTodosByList: queryCache.get('todos-by-list', () =>
    db.select().from(todoItem)
      .where(eq(todoItem.todoListId, placeholder('listId')))
      .orderBy(asc(todoItem.position))
      .prepare()
  ),
  
  // Page queries
  getAllPages: queryCache.get('all-pages', () =>
    db.select().from(pages).orderBy(asc(pages.createdAt)).prepare()
  ),
}

// Performance monitoring utilities
export class QueryProfiler {
  private static queries: Array<{
    query: string
    duration: number
    timestamp: Date
  }> = []
  
  public static profile<T>(queryName: string, operation: () => T): T {
    const start = performance.now()
    
    try {
      const result = operation()
      return result
    } finally {
      const duration = performance.now() - start
      
      this.queries.push({
        query: queryName,
        duration,
        timestamp: new Date()
      })
      
      // Keep only last 1000 queries
      if (this.queries.length > 1000) {
        this.queries = this.queries.slice(-1000)
      }
      
      // Log slow queries
      if (duration > 100) {
        console.warn(`Slow query detected: ${queryName} took ${duration.toFixed(2)}ms`)
      }
    }
  }
  
  public static async profileAsync<T>(queryName: string, operation: () => Promise<T>): Promise<T> {
    const start = performance.now()
    
    try {
      const result = await operation()
      return result
    } finally {
      const duration = performance.now() - start
      
      this.queries.push({
        query: queryName,
        duration,
        timestamp: new Date()
      })
      
      // Keep only last 1000 queries
      if (this.queries.length > 1000) {
        this.queries = this.queries.slice(-1000)
      }
      
      // Log slow queries
      if (duration > 100) {
        console.warn(`Slow query detected: ${queryName} took ${duration.toFixed(2)}ms`)
      }
    }
  }
  
  public static getStats() {
    const recent = this.queries.slice(-100) // Last 100 queries
    const avgDuration = recent.reduce((sum, q) => sum + q.duration, 0) / recent.length || 0
    const slowQueries = recent.filter(q => q.duration > 100)
    
    return {
      totalQueries: this.queries.length,
      recentQueries: recent.length,
      averageDuration: Math.round(avgDuration * 100) / 100,
      slowQueries: slowQueries.length,
      slowestQuery: recent.reduce((max, q) => q.duration > max.duration ? q : max, recent[0] || { duration: 0 })
    }
  }
  
  public static clear() {
    this.queries = []
  }
}

// Database maintenance utilities
export async function analyzeTables(): Promise<void> {
  try {
    await db.run(sql`ANALYZE`)
    console.log('Database analysis completed')
  } catch (error) {
    console.error('Database analysis failed:', error)
  }
}

export async function optimizeDatabase(): Promise<void> {
  try {
    await db.run(sql`PRAGMA optimize`)
    console.log('Database optimization completed')
  } catch (error) {
    console.error('Database optimization failed:', error)
  }
}

// Export database connection for direct access when needed
export { db } from './db'