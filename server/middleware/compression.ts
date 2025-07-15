import { createHash } from 'crypto'
import { getRequestURL, setHeader, setHeaders, setResponseStatus, getHeader } from 'h3'

/**
 * Compression and response optimization middleware
 * Handles ETag generation, compression hints, and caching headers
 */

export default defineEventHandler(async (event) => {
  // Only handle API routes and specific file types
  const url = getRequestURL(event)
  const isAPI = url.pathname.startsWith('/api/')
  const isAsset = /\.(js|css|json|svg|png|jpg|jpeg|gif|webp|woff2?|ttf|eot)$/.test(url.pathname)
  
  if (!isAPI && !isAsset) {
    return
  }

  // Set vary header for content negotiation
  if (isAPI) {
    setHeader(event, 'vary', 'accept-encoding')
  }

  // Optimize API responses
  if (isAPI) {
    // Add security headers
    setHeaders(event, {
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'DENY',
      'x-xss-protection': '1; mode=block',
      'referrer-policy': 'strict-origin-when-cross-origin'
    })

    // Add CORS headers for development
    if (process.env.NODE_ENV === 'development') {
      setHeaders(event, {
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'access-control-allow-headers': 'content-type, authorization, x-csrf-token'
      })
    }

    // Handle preflight requests
    if (event.node.req.method === 'OPTIONS') {
      setResponseStatus(event, 204)
      return ''
    }

    // Set cache headers for different API types
    const pathname = url.pathname
    
    if (pathname.includes('/health/')) {
      // Health endpoints - short cache
      setHeader(event, 'cache-control', 'public, max-age=30, stale-while-revalidate=60')
    } else if (pathname.includes('/pages')) {
      // Pages data - medium cache with revalidation
      setHeader(event, 'cache-control', 'public, max-age=300, stale-while-revalidate=600')
    } else if (pathname.includes('/mode-state')) {
      // Mode state - short cache
      setHeader(event, 'cache-control', 'public, max-age=60, stale-while-revalidate=120')
    } else if (pathname.includes('/widgets-instances')) {
      // Widget instances - medium cache
      setHeader(event, 'cache-control', 'public, max-age=300, stale-while-revalidate=600')
    } else if (pathname.includes('/todo-lists')) {
      // Todo data - short cache for real-time updates
      setHeader(event, 'cache-control', 'public, max-age=60, stale-while-revalidate=120')
    } else {
      // Default API cache
      setHeader(event, 'cache-control', 'public, max-age=60, stale-while-revalidate=120')
    }
  }

  // Optimize static assets
  if (isAsset) {
    const ext = url.pathname.split('.').pop()?.toLowerCase()
    
    switch (ext) {
      case 'js':
      case 'css':
        // JavaScript and CSS - long cache with immutable hint
        setHeader(event, 'cache-control', 'public, max-age=31536000, immutable')
        break
      case 'json':
        // JSON files - medium cache
        setHeader(event, 'cache-control', 'public, max-age=3600, stale-while-revalidate=7200')
        break
      case 'svg':
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'webp':
        // Images - long cache
        setHeader(event, 'cache-control', 'public, max-age=2592000, stale-while-revalidate=86400')
        break
      case 'woff':
      case 'woff2':
      case 'ttf':
      case 'eot':
        // Fonts - very long cache
        setHeader(event, 'cache-control', 'public, max-age=31536000, immutable')
        break
      default:
        // Default asset cache
        setHeader(event, 'cache-control', 'public, max-age=3600, stale-while-revalidate=7200')
    }
  }
})

/**
 * Generate ETag for response data
 */
export function generateETag(data: any): string {
  const content = typeof data === 'string' ? data : JSON.stringify(data)
  return createHash('md5').update(content).digest('hex')
}

/**
 * Check if request matches ETag (304 Not Modified)
 */
export function checkETag(event: any, etag: string): boolean {
  const ifNoneMatch = getHeader(event, 'if-none-match')
  return ifNoneMatch === etag
}