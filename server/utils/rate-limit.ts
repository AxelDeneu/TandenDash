import { H3Event, createError, setHeader, getHeader } from 'h3'
import { LRUCache } from 'lru-cache'

// Rate limit configuration
interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  max: number // Max requests per window
  message?: string // Error message
  skipFailedRequests?: boolean // Don't count failed requests
  skipSuccessfulRequests?: boolean // Don't count successful requests
  keyGenerator?: (event: H3Event) => string // Custom key generator
  slidingWindow?: boolean // Use sliding window algorithm
}

interface SlidingWindowEntry {
  timestamps: number[]
}

// Default configurations for different endpoints
export const RateLimitConfigs = {
  // Standard API limit
  api: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
    message: 'Too many requests, please slow down',
    slidingWindow: true
  },
  
  // Relaxed limit for read operations
  read: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: 'Too many requests, please slow down'
  },
  
  // Strict limit for write operations with sliding window
  write: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 20, // 20 requests per minute
    message: 'Too many write operations, please slow down',
    slidingWindow: true
  }
}

// Create a rate limiter instance
export function createRateLimiter(config: RateLimitConfig) {
  const cache = config.slidingWindow
    ? new LRUCache<string, SlidingWindowEntry>({
        max: 10000, // Store up to 10k unique IPs
        ttl: config.windowMs * 2 // Keep entries for 2x the window
      })
    : new LRUCache<string, number>({
        max: 10000,
        ttl: config.windowMs
      })

  return {
    check: (event: H3Event) => {
      const key = config.keyGenerator ? config.keyGenerator(event) : getClientIP(event) || 'unknown'
      const now = Date.now()
      
      if (config.slidingWindow) {
        // Sliding window algorithm
        const entry = (cache as LRUCache<string, SlidingWindowEntry>).get(key) || { timestamps: [] }
        const windowStart = now - config.windowMs
        
        // Filter out timestamps outside the window
        entry.timestamps = entry.timestamps.filter(ts => ts > windowStart)
        
        if (entry.timestamps.length >= config.max) {
          const oldestInWindow = entry.timestamps[0]
          const resetTime = oldestInWindow + config.windowMs
          
          throw createError({
            statusCode: 429,
            statusMessage: config.message || 'Too Many Requests',
            headers: {
              'Retry-After': String(Math.ceil((resetTime - now) / 1000)),
              'X-RateLimit-Limit': String(config.max),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': new Date(resetTime).toISOString()
            }
          })
        }
        
        // Store for increment after request
        event.context.rateLimitKey = key
        event.context.rateLimitEntry = entry
        event.context.rateLimitTimestamp = now
      } else {
        // Fixed window algorithm (legacy)
        const current = (cache as LRUCache<string, number>).get(key) || 0
        
        if (current >= config.max) {
          throw createError({
            statusCode: 429,
            statusMessage: config.message || 'Too Many Requests',
            headers: {
              'Retry-After': String(Math.ceil(config.windowMs / 1000)),
              'X-RateLimit-Limit': String(config.max),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': new Date(Date.now() + config.windowMs).toISOString()
            }
          })
        }
        
        event.context.rateLimitKey = key
        event.context.rateLimitCache = cache
        event.context.rateLimitCurrent = current
      }
    },
    
    increment: (event: H3Event) => {
      const key = event.context.rateLimitKey as string
      if (!key) return
      
      // Check if we should skip this request
      const statusCode = event.node.res.statusCode || 200
      const isSuccess = statusCode >= 200 && statusCode < 300
      
      if (config.skipFailedRequests && !isSuccess) return
      if (config.skipSuccessfulRequests && isSuccess) return
      
      if (config.slidingWindow) {
        // Sliding window increment
        const entry = event.context.rateLimitEntry as SlidingWindowEntry
        const timestamp = event.context.rateLimitTimestamp as number
        
        entry.timestamps.push(timestamp)
        ;(cache as LRUCache<string, SlidingWindowEntry>).set(key, entry)
        
        // Set headers
        try {
          if (!event.node.res.headersSent) {
            const remaining = Math.max(0, config.max - entry.timestamps.length)
            const windowStart = timestamp - config.windowMs
            const validTimestamps = entry.timestamps.filter(ts => ts > windowStart)
            const oldestInWindow = validTimestamps[0] || timestamp
            const resetTime = oldestInWindow + config.windowMs
            
            setHeader(event, 'X-RateLimit-Limit', String(config.max))
            setHeader(event, 'X-RateLimit-Remaining', String(remaining))
            setHeader(event, 'X-RateLimit-Reset', new Date(resetTime).toISOString())
          }
        } catch (error) {
          console.debug('Rate limit headers could not be set:', (error as Error).message)
        }
      } else {
        // Fixed window increment (legacy)
        const rateLimitCache = event.context.rateLimitCache as LRUCache<string, number>
        const current = event.context.rateLimitCurrent as number
        
        rateLimitCache.set(key, current + 1)
        
        try {
          if (!event.node.res.headersSent) {
            setHeader(event, 'X-RateLimit-Limit', String(config.max))
            setHeader(event, 'X-RateLimit-Remaining', String(Math.max(0, config.max - current - 1)))
            setHeader(event, 'X-RateLimit-Reset', new Date(Date.now() + config.windowMs).toISOString())
          }
        } catch (error) {
          console.debug('Rate limit headers could not be set:', (error as Error).message)
        }
      }
    }
  }
}

// Get client IP address
export function getClientIP(event: H3Event): string | null {
  // Check various headers for the real IP
  const headers = [
    'x-forwarded-for',
    'x-real-ip',
    'cf-connecting-ip', // Cloudflare
    'x-client-ip',
    'x-forwarded',
    'forwarded-for',
    'forwarded'
  ]
  
  for (const header of headers) {
    const value = getHeader(event, header)
    if (value) {
      // Handle comma-separated list (x-forwarded-for)
      const ip = value.split(',')[0].trim()
      if (ip && isValidIP(ip)) return ip
    }
  }
  
  // Fallback to remote address
  const remoteAddr = event.node.req.socket.remoteAddress
  return (remoteAddr && isValidIP(remoteAddr)) ? remoteAddr : null
}

// Validate IP address format
function isValidIP(ip: string): boolean {
  // Basic IPv4 validation
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
  // Basic IPv6 validation
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip)
}