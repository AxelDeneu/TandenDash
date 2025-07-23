import type { CalendarEvent } from '../types'
import crypto from 'crypto'

/**
 * Encrypt sensitive data (passwords)
 */
export function encryptPassword(password: string, key: string): string {
  const algorithm = 'aes-256-cbc'
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'hex'), iv)
  
  let encrypted = cipher.update(password, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  return iv.toString('hex') + ':' + encrypted
}

/**
 * Decrypt sensitive data (passwords)
 */
export function decryptPassword(encryptedPassword: string, key: string): string {
  const algorithm = 'aes-256-cbc'
  const [ivHex, encrypted] = encryptedPassword.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key, 'hex'), iv)
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

/**
 * Generate encryption key from widget instance ID
 */
export function generateEncryptionKey(widgetInstanceId: number): string {
  // In production, use a proper key derivation function
  // This is a simplified version for the example
  const hash = crypto.createHash('sha256')
  hash.update(`widget-${widgetInstanceId}-caldav-secret`)
  return hash.digest('hex')
}

/**
 * Build CalDAV PROPFIND request XML
 */
export function buildPropfindXML(props: string[]): string {
  const propElements = props.map(prop => {
    if (prop.includes(':')) {
      return `    <${prop}/>`
    }
    return `    <d:${prop}/>`
  }).join('\n')

  return `<?xml version="1.0" encoding="utf-8"?>
<d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop>
${propElements}
  </d:prop>
</d:propfind>`
}

/**
 * Build CalDAV REPORT request XML for calendar query
 */
export function buildCalendarQueryXML(startDate: string, endDate: string): string {
  // Convert ISO dates to CalDAV format (YYYYMMDDTHHMMSSZ)
  const formatCalDAVDate = (date: string) => {
    return date.replace(/[-:]/g, '').split('.')[0] + 'Z'
  }

  return `<?xml version="1.0" encoding="utf-8"?>
<c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop>
    <d:getetag/>
    <c:calendar-data/>
  </d:prop>
  <c:filter>
    <c:comp-filter name="VCALENDAR">
      <c:comp-filter name="VEVENT">
        <c:time-range start="${formatCalDAVDate(startDate)}"
                      end="${formatCalDAVDate(endDate)}"/>
      </c:comp-filter>
    </c:comp-filter>
  </c:filter>
</c:calendar-query>`
}

/**
 * Parse XML namespace-aware element
 */
export function parseXMLElement(xml: string, tagName: string, namespace?: string): string | null {
  // Build regex pattern for namespace-aware parsing
  const nsPrefix = namespace ? `(?:${namespace}:)?` : '(?:\\w+:)?'
  const pattern = new RegExp(`<${nsPrefix}${tagName}[^>]*>([^<]*)<\\/${nsPrefix}${tagName}>`, 'i')
  const match = xml.match(pattern)
  return match ? match[1] : null
}

/**
 * Parse multistatus XML response
 */
export function parseMultistatusResponse(xml: string): Array<{
  href: string
  props: Record<string, string>
  status?: string
}> {
  const responses: Array<{ href: string; props: Record<string, string>; status?: string }> = []
  
  // Extract all response elements
  const responseRegex = /<(?:\w+:)?response>([\s\S]*?)<\/(?:\w+:)?response>/gi
  let match
  
  while ((match = responseRegex.exec(xml)) !== null) {
    const responseXml = match[1]
    
    const href = parseXMLElement(responseXml, 'href') || ''
    const status = parseXMLElement(responseXml, 'status')
    
    // Extract all properties
    const props: Record<string, string> = {}
    
    // Common properties
    const etag = parseXMLElement(responseXml, 'getetag')
    if (etag) props.etag = etag.replace(/"/g, '')
    
    const displayName = parseXMLElement(responseXml, 'displayname')
    if (displayName) props.displayName = displayName
    
    const calendarData = parseXMLElement(responseXml, 'calendar-data', 'c|cal')
    if (calendarData) props.calendarData = calendarData.trim()
    
    responses.push({ href, props, status: status || undefined })
  }
  
  return responses
}

/**
 * Detect sync conflicts between local and remote events
 */
export function detectConflicts(
  localEvent: CalendarEvent,
  remoteEvent: CalendarEvent
): 'none' | 'etag' | 'content' {
  // If ETags don't match, there's definitely a conflict
  if (localEvent.etag && remoteEvent.etag && localEvent.etag !== remoteEvent.etag) {
    return 'etag'
  }
  
  // Compare content for conflicts
  const contentFields: (keyof CalendarEvent)[] = [
    'title', 'description', 'location', 'startDate', 'endDate', 'allDay'
  ]
  
  for (const field of contentFields) {
    if (localEvent[field] !== remoteEvent[field]) {
      return 'content'
    }
  }
  
  return 'none'
}

/**
 * Merge events with conflict resolution
 */
export function mergeEvents(
  localEvent: CalendarEvent,
  remoteEvent: CalendarEvent,
  resolution: 'local' | 'remote' | 'merge'
): CalendarEvent {
  if (resolution === 'local') {
    return {
      ...localEvent,
      etag: remoteEvent.etag, // Update ETag to match server
      syncedAt: new Date().toISOString()
    }
  }
  
  if (resolution === 'remote') {
    return {
      ...remoteEvent,
      id: localEvent.id, // Keep local ID
      syncedAt: new Date().toISOString()
    }
  }
  
  // Merge: take newer values
  const localUpdated = new Date(localEvent.updatedAt).getTime()
  const remoteUpdated = new Date(remoteEvent.updatedAt).getTime()
  
  return {
    ...localEvent,
    ...(remoteUpdated > localUpdated ? remoteEvent : {}),
    id: localEvent.id,
    etag: remoteEvent.etag,
    caldavHref: remoteEvent.caldavHref,
    syncedAt: new Date().toISOString()
  }
}

/**
 * Generate a CalDAV-compatible UID
 */
export function generateCalDAVUID(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 9)
  return `${timestamp}-${random}@tandendash.local`
}

/**
 * Validate CalDAV server URL
 */
export function validateCalDAVUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url)
    
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'URL must use HTTP or HTTPS protocol' }
    }
    
    return { valid: true }
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' }
  }
}

/**
 * Parse CalDAV error response
 */
export function parseCalDAVError(xml: string): { code?: string; message?: string } {
  const errorCode = parseXMLElement(xml, 'error')
  const precondition = xml.match(/<(?:\w+:)?precondition-failed[^>]*\/?>/)
  
  if (precondition) {
    return { code: 'PRECONDITION_FAILED', message: 'Resource was modified' }
  }
  
  return {
    code: errorCode || 'UNKNOWN',
    message: parseXMLElement(xml, 'responsedescription') || 'Unknown error'
  }
}