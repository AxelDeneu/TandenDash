import type { H3Event } from 'h3'

// Cache configuration for different endpoints
const cacheConfig: Record<string, { maxAge: number; sMaxAge?: number; staleWhileRevalidate?: number }> = {
  // Pages - cache for 5 minutes
  '/api/pages': { maxAge: 300, sMaxAge: 300, staleWhileRevalidate: 60 },
  
  // Widgets - cache for 3 minutes  
  '/api/widgets-instances': { maxAge: 180, sMaxAge: 180, staleWhileRevalidate: 30 },
  
  // Todo lists - cache for 2 minutes
  '/api/todo-lists': { maxAge: 120, sMaxAge: 120, staleWhileRevalidate: 30 },
  
  // Mode state - no cache (real-time)
  '/api/mode-state': { maxAge: 0 },
  
  // Static widget definitions - cache for 1 hour
  '/api/widgets/definitions': { maxAge: 3600, sMaxAge: 3600 }
}

export default defineEventHandler(async (event: H3Event) => {
  const url = event.path
  
  // Only apply to GET requests
  if (event.method !== 'GET') {
    return
  }
  
  // Find matching cache config
  let config = null
  for (const [pattern, cfg] of Object.entries(cacheConfig)) {
    if (url.startsWith(pattern)) {
      config = cfg
      break
    }
  }
  
  // Apply cache headers if config found
  if (config) {
    const parts: string[] = []
    
    if (config.maxAge === 0) {
      // No cache
      setHeader(event, 'cache-control', 'no-store, no-cache, must-revalidate')
      setHeader(event, 'pragma', 'no-cache')
      setHeader(event, 'expires', '0')
    } else {
      // Build cache control header
      if (config.maxAge) {
        parts.push(`max-age=${config.maxAge}`)
      }
      if (config.sMaxAge) {
        parts.push(`s-maxage=${config.sMaxAge}`)
      }
      if (config.staleWhileRevalidate) {
        parts.push(`stale-while-revalidate=${config.staleWhileRevalidate}`)
      }
      
      parts.push('public')
      
      setHeader(event, 'cache-control', parts.join(', '))
      
      // Add ETag support
      event.context.addETag = true
    }
    
    // Add Vary header for content negotiation
    setHeader(event, 'vary', 'Accept, Accept-Encoding')
  }
})