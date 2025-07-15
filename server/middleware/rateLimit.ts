import { defineEventHandler } from 'h3'
import { createRateLimiter, RateLimitConfigs } from '../utils/rate-limit'

// Create rate limiters for different endpoint types
const apiWriteLimiter = createRateLimiter(RateLimitConfigs.write)
const apiReadLimiter = createRateLimiter(RateLimitConfigs.read)

// Define which routes use which rate limiter
const RATE_LIMIT_ROUTES = {
  write: [
    // Routes that modify data
    { pattern: /^\/api\/widgets-instances$/, methods: ['POST', 'PUT', 'DELETE'] },
    { pattern: /^\/api\/pages$/, methods: ['POST', 'PUT', 'DELETE'] },
    { pattern: /^\/api\/todo-lists/, methods: ['POST', 'PUT', 'DELETE'] },
    { pattern: /^\/api\/mode-state$/, methods: ['POST'] }
  ],
  read: [
    // Routes that only read data
    { pattern: /^\/api\/widgets-instances$/, methods: ['GET'] },
    { pattern: /^\/api\/pages$/, methods: ['GET'] },
    { pattern: /^\/api\/todo-lists/, methods: ['GET'] },
    { pattern: /^\/api\/weather/, methods: ['GET'] }
  ]
}

export default defineEventHandler(async (event) => {
  const url = event.node.req.url || ''
  const method = event.node.req.method || 'GET'
  
  // Skip rate limiting for non-API routes
  if (!url.startsWith('/api/')) {
    return
  }
  
  // Apply rate limiting based on route type
  try {
    // Check write routes
    if (RATE_LIMIT_ROUTES.write.some(route => 
      route.pattern.test(url) && route.methods.includes(method)
    )) {
      apiWriteLimiter.check(event)
    }
    // Check read routes
    else if (RATE_LIMIT_ROUTES.read.some(route => 
      route.pattern.test(url) && route.methods.includes(method)
    )) {
      apiReadLimiter.check(event)
    }
    // Default rate limit for other API routes
    else if (url.startsWith('/api/')) {
      apiReadLimiter.check(event)
    }
  } catch (error) {
    // Re-throw rate limit errors
    throw error
  }
  
  // Set up response hook to increment counter after request
  event.node.res.on('finish', () => {
    // Increment the appropriate rate limiter
    if (RATE_LIMIT_ROUTES.write.some(route => 
      route.pattern.test(url) && route.methods.includes(method)
    )) {
      apiWriteLimiter.increment(event)
    } else if (RATE_LIMIT_ROUTES.read.some(route => 
      route.pattern.test(url) && route.methods.includes(method)
    )) {
      apiReadLimiter.increment(event)
    } else if (url.startsWith('/api/')) {
      apiReadLimiter.increment(event)
    }
  })
})