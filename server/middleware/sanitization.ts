import { defineEventHandler, readBody, createError } from 'h3'
import DOMPurify from 'isomorphic-dompurify'

// Simple function to get client IP
function getClientIP(event: any): string {
  const headers = event.node.req.headers
  return (headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 
         headers['x-real-ip'] as string || 
         event.node.req.socket?.remoteAddress || 
         'unknown'
}

// Configuration for different content types
const SANITIZATION_CONFIG = {
  // Strict: Remove all HTML
  strict: {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  },
  // Basic: Allow basic formatting
  basic: {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  },
  // Rich: Allow more formatting (for widget content)
  rich: {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p', 'ul', 'ol', 'li', 'a', 'code', 'pre'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i
  }
}

// Routes that need different sanitization levels
const SANITIZATION_ROUTES = {
  strict: [
    '/api/auth/',
    '/api/pages'
  ],
  basic: [
    '/api/todo-lists',
    '/api/widgets-instances',
    '/api/mode-state'
  ],
  rich: [
    // Currently none, but ready for future use
  ],
  skip: [
    '/api/csrf-token',
    '/api/health/'
  ]
}

// Recursive sanitization function
function sanitizeValue(value: unknown, config: typeof SANITIZATION_CONFIG.strict): unknown {
  if (typeof value === 'string') {
    // Sanitize HTML
    const cleaned = DOMPurify.sanitize(value, config)
    
    // Additional sanitization for common injection patterns
    return cleaned
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
      .replace(/<!--.*?-->/g, '') // Remove HTML comments
      .trim()
  }
  
  if (Array.isArray(value)) {
    return value.map(item => sanitizeValue(item, config))
  }
  
  if (value && typeof value === 'object' && value.constructor === Object) {
    const sanitized: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value)) {
      // Sanitize keys too (prevent prototype pollution)
      const sanitizedKey = key.replace(/[^\w.-]/g, '_')
      if (!['__proto__', 'constructor', 'prototype'].includes(sanitizedKey)) {
        sanitized[sanitizedKey] = sanitizeValue(val, config)
      }
    }
    return sanitized
  }
  
  // Return other types as-is (numbers, booleans, null, etc.)
  return value
}

// SQL injection prevention patterns
const SQL_INJECTION_PATTERNS = [
  /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b).*(\bfrom\b|\binto\b|\bwhere\b)/gi,
  /(--|\/\*|\*\/|'|"|`).*(\bfrom\b|\bwhere\b|\bunion\b)/gi,
  /(\bor\b|\band\b)\s*\d+\s*=\s*\d+/gi, // OR 1=1 patterns
  /\b(char|nchar|varchar|nvarchar)\s*\(.*\)/gi
]

// Check for potential SQL injection
function containsSQLInjection(value: string): boolean {
  // Skip short values that are unlikely to be injections
  if (value.length < 10) return false
  
  // Skip values that are clearly enums or simple values
  if (/^(light|dark|true|false|yes|no|on|off)$/i.test(value)) return false
  
  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(value))
}

// NoSQL injection prevention
const NOSQL_INJECTION_PATTERNS = [
  /\$[a-zA-Z]+/, // MongoDB operators like $where, $ne, etc.
  /\{[^}]*\$[^}]*\}/, // Object with $ operators
]

// Check for potential NoSQL injection
function containsNoSQLInjection(value: string): boolean {
  const stringified = JSON.stringify(value)
  return NOSQL_INJECTION_PATTERNS.some(pattern => pattern.test(stringified))
}

export default defineEventHandler(async (event) => {
  const url = event.node.req.url || ''
  const method = event.node.req.method || 'GET'
  
  // Only sanitize for API routes with body
  if (!url.startsWith('/api/') || !['POST', 'PUT', 'PATCH'].includes(method)) {
    return
  }
  
  // Skip certain routes that don't need sanitization
  if (SANITIZATION_ROUTES.skip.some(route => url.startsWith(route))) {
    return
  }
  
  // Skip if body was already read
  if (event.context._bodyParsed) {
    return
  }
  
  try {
    const body = await readBody(event)
    event.context._bodyParsed = true
    
    if (!body || typeof body !== 'object') {
      return
    }
    
    // Determine sanitization level
    let config = SANITIZATION_CONFIG.strict
    if (SANITIZATION_ROUTES.basic.some(route => url.startsWith(route))) {
      config = SANITIZATION_CONFIG.basic
    } else if (SANITIZATION_ROUTES.rich.some(route => url.startsWith(route))) {
      config = SANITIZATION_CONFIG.rich
    }
    
    // Sanitize the body
    const sanitized = sanitizeValue(body, config)
    
    // Check for injection attempts
    const bodyString = JSON.stringify(sanitized)
    if (containsSQLInjection(bodyString)) {
      console.warn('Potential SQL injection attempt blocked:', {
        ip: getClientIP(event),
        url,
        method
      })
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid input detected'
      })
    }
    
    if (containsNoSQLInjection(bodyString)) {
      console.warn('Potential NoSQL injection attempt blocked:', {
        ip: getClientIP(event),
        url,
        method
      })
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid input detected'
      })
    }
    
    // Replace the body with sanitized version
    event.context.body = sanitized
    
    // Override readBody to return sanitized data
    event.context.readBody = async () => sanitized
  } catch (error) {
    // If it's our error, re-throw it
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    // Otherwise, log and continue (don't break the request)
    console.error('Sanitization error:', error)
  }
})