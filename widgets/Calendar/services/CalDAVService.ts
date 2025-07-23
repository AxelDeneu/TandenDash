// @ts-ignore - ical.js doesn't have types
import ICAL from 'ical.js'
import type { CalendarEvent, CalDAVConfig, CalDAVSyncResult } from '../types'
import { formatISO, parseISO } from 'date-fns'

export class CalDAVService {
  private config: CalDAVConfig
  private headers: Record<string, string>

  constructor(config: CalDAVConfig) {
    this.config = config
    this.headers = this.buildHeaders()
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/xml; charset=utf-8',
      'Accept': 'application/xml, text/calendar'
    }

    // Basic auth
    if (this.config.authMethod === 'basic' || !this.config.authMethod) {
      const auth = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64')
      headers['Authorization'] = `Basic ${auth}`
    }

    return headers
  }

  /**
   * Discover CalDAV calendars for the user
   */
  async discoverCalendars(): Promise<Array<{ url: string; displayName: string; description?: string }>> {
    const principalUrl = this.config.principalUrl || await this.discoverPrincipal()
    
    const propfindBody = `<?xml version="1.0" encoding="utf-8"?>
<d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop>
    <c:calendar-home-set/>
  </d:prop>
</d:propfind>`

    const response = await fetch(`${this.config.serverUrl}${principalUrl}`, {
      method: 'PROPFIND',
      headers: {
        ...this.headers,
        'Depth': '0'
      },
      body: propfindBody
    })

    if (!response.ok) {
      throw new Error(`Failed to discover calendars: ${response.status} ${response.statusText}`)
    }

    const xml = await response.text()
    const calendarHomeSet = this.extractCalendarHomeSet(xml)

    // Now get the actual calendars
    return this.fetchCalendars(calendarHomeSet)
  }

  /**
   * Discover the principal URL for the user
   */
  private async discoverPrincipal(): Promise<string> {
    const propfindBody = `<?xml version="1.0" encoding="utf-8"?>
<d:propfind xmlns:d="DAV:">
  <d:prop>
    <d:current-user-principal/>
  </d:prop>
</d:propfind>`

    const response = await fetch(this.config.serverUrl, {
      method: 'PROPFIND',
      headers: {
        ...this.headers,
        'Depth': '0'
      },
      body: propfindBody
    })

    if (!response.ok) {
      throw new Error(`Failed to discover principal: ${response.status} ${response.statusText}`)
    }

    const xml = await response.text()
    return this.extractPrincipalUrl(xml)
  }

  /**
   * Fetch list of calendars from calendar home
   */
  private async fetchCalendars(calendarHomeUrl: string): Promise<Array<{ url: string; displayName: string; description?: string }>> {
    const propfindBody = `<?xml version="1.0" encoding="utf-8"?>
<d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop>
    <d:displayname/>
    <c:calendar-description/>
    <d:resourcetype/>
  </d:prop>
</d:propfind>`

    const response = await fetch(`${this.config.serverUrl}${calendarHomeUrl}`, {
      method: 'PROPFIND',
      headers: {
        ...this.headers,
        'Depth': '1'
      },
      body: propfindBody
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch calendars: ${response.status} ${response.statusText}`)
    }

    const xml = await response.text()
    return this.parseCalendarList(xml)
  }

  /**
   * Fetch events from CalDAV server
   */
  async fetchEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    const calendarUrl = this.config.calendarUrl
    if (!calendarUrl) {
      throw new Error('Calendar URL not configured')
    }

    const reportBody = `<?xml version="1.0" encoding="utf-8"?>
<c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop>
    <d:getetag/>
    <c:calendar-data/>
  </d:prop>
  <c:filter>
    <c:comp-filter name="VCALENDAR">
      <c:comp-filter name="VEVENT">
        <c:time-range start="${formatISO(startDate).replace(/[-:]/g, '').split('.')[0]}Z"
                      end="${formatISO(endDate).replace(/[-:]/g, '').split('.')[0]}Z"/>
      </c:comp-filter>
    </c:comp-filter>
  </c:filter>
</c:calendar-query>`

    const response = await fetch(`${this.config.serverUrl}${calendarUrl}`, {
      method: 'REPORT',
      headers: {
        ...this.headers,
        'Depth': '1'
      },
      body: reportBody
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.status} ${response.statusText}`)
    }

    const xml = await response.text()
    return this.parseEventsFromXML(xml)
  }

  /**
   * Create a new event on CalDAV server
   */
  async createEvent(event: Partial<CalendarEvent>): Promise<{ href: string; etag: string }> {
    const calendarUrl = this.config.calendarUrl
    if (!calendarUrl) {
      throw new Error('Calendar URL not configured')
    }

    // Generate a unique filename for the event
    const uid = event.uid || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@tandendash`
    const filename = `${uid}.ics`
    const eventUrl = `${calendarUrl}${filename}`

    // Convert event to iCalendar format
    const icalData = this.eventToICal(event, uid)

    const response = await fetch(`${this.config.serverUrl}${eventUrl}`, {
      method: 'PUT',
      headers: {
        ...this.headers,
        'Content-Type': 'text/calendar; charset=utf-8'
      },
      body: icalData
    })

    if (!response.ok) {
      throw new Error(`Failed to create event: ${response.status} ${response.statusText}`)
    }

    const etag = response.headers.get('ETag') || ''
    return { href: eventUrl, etag }
  }

  /**
   * Update an existing event on CalDAV server
   */
  async updateEvent(event: CalendarEvent): Promise<{ etag: string }> {
    if (!event.caldavHref) {
      throw new Error('Event does not have CalDAV href')
    }

    // Convert event to iCalendar format
    const icalData = this.eventToICal(event, event.uid!)

    const headers: Record<string, string> = { ...this.headers, 'Content-Type': 'text/calendar; charset=utf-8' }
    
    // Add If-Match header for conflict detection
    if (event.etag) {
      headers['If-Match'] = event.etag
    }

    const response = await fetch(`${this.config.serverUrl}${event.caldavHref}`, {
      method: 'PUT',
      headers,
      body: icalData
    })

    if (response.status === 412) {
      throw new Error('CONFLICT: Event was modified on server')
    }

    if (!response.ok) {
      throw new Error(`Failed to update event: ${response.status} ${response.statusText}`)
    }

    const etag = response.headers.get('ETag') || ''
    return { etag }
  }

  /**
   * Delete an event from CalDAV server
   */
  async deleteEvent(event: CalendarEvent): Promise<void> {
    if (!event.caldavHref) {
      throw new Error('Event does not have CalDAV href')
    }

    const headers: Record<string, string> = { ...this.headers }
    
    // Add If-Match header for conflict detection
    if (event.etag) {
      headers['If-Match'] = event.etag
    }

    const response = await fetch(`${this.config.serverUrl}${event.caldavHref}`, {
      method: 'DELETE',
      headers
    })

    if (response.status === 412) {
      throw new Error('CONFLICT: Event was modified on server')
    }

    if (!response.ok && response.status !== 404) {
      throw new Error(`Failed to delete event: ${response.status} ${response.statusText}`)
    }
  }

  /**
   * Convert CalendarEvent to iCalendar format
   */
  private eventToICal(event: Partial<CalendarEvent>, uid: string): string {
    const vcalendar = new ICAL.Component('vcalendar')
    vcalendar.addPropertyWithValue('version', '2.0')
    vcalendar.addPropertyWithValue('prodid', '-//TandenDash//Calendar Widget//EN')

    const vevent = new ICAL.Component('vevent')
    vevent.addPropertyWithValue('uid', uid)
    vevent.addPropertyWithValue('summary', event.title || 'Untitled Event')
    
    if (event.description) {
      vevent.addPropertyWithValue('description', event.description)
    }
    
    if (event.location) {
      vevent.addPropertyWithValue('location', event.location)
    }

    // Handle dates
    const startDate = event.startDate ? parseISO(event.startDate) : new Date()
    const endDate = event.endDate ? parseISO(event.endDate) : new Date(startDate.getTime() + 3600000)

    if (event.allDay) {
      // All-day events use DATE value type
      const startProp = new ICAL.Property('dtstart')
      startProp.setValue(ICAL.Time.fromJSDate(startDate, true))
      vevent.addProperty(startProp)

      const endProp = new ICAL.Property('dtend')
      endProp.setValue(ICAL.Time.fromJSDate(endDate, true))
      vevent.addProperty(endProp)
    } else {
      // Timed events use DATE-TIME value type
      vevent.addPropertyWithValue('dtstart', ICAL.Time.fromJSDate(startDate))
      vevent.addPropertyWithValue('dtend', ICAL.Time.fromJSDate(endDate))
    }

    // Add timestamp
    vevent.addPropertyWithValue('dtstamp', ICAL.Time.now())
    vevent.addPropertyWithValue('last-modified', ICAL.Time.now())

    vcalendar.addSubcomponent(vevent)
    
    return vcalendar.toString()
  }

  /**
   * Parse XML response to extract calendar home set
   */
  private extractCalendarHomeSet(xml: string): string {
    // Simple XML parsing - in production, use a proper XML parser
    const match = xml.match(/<(?:cal:|c:)?calendar-home-set>\s*<(?:d:)?href>([^<]+)<\/(?:d:)?href>/i)
    return match ? match[1] : '/calendars/'
  }

  /**
   * Parse XML response to extract principal URL
   */
  private extractPrincipalUrl(xml: string): string {
    const match = xml.match(/<(?:d:)?current-user-principal>\s*<(?:d:)?href>([^<]+)<\/(?:d:)?href>/i)
    return match ? match[1] : `/principals/${this.config.username}/`
  }

  /**
   * Parse XML response to extract calendar list
   */
  private parseCalendarList(xml: string): Array<{ url: string; displayName: string; description?: string }> {
    const calendars: Array<{ url: string; displayName: string; description?: string }> = []
    
    // Simple parsing - in production use proper XML parser
    const responseRegex = /<(?:d:)?response>([\s\S]*?)<\/(?:d:)?response>/gi
    let match
    
    while ((match = responseRegex.exec(xml)) !== null) {
      const responseXml = match[1]
      
      // Check if it's a calendar collection
      if (responseXml.includes('<cal:calendar') || responseXml.includes('<c:calendar')) {
        const hrefMatch = responseXml.match(/<(?:d:)?href>([^<]+)<\/(?:d:)?href>/)
        const displayNameMatch = responseXml.match(/<(?:d:)?displayname>([^<]*)<\/(?:d:)?displayname>/)
        const descriptionMatch = responseXml.match(/<(?:cal:|c:)?calendar-description>([^<]*)<\/(?:cal:|c:)?calendar-description>/)
        
        if (hrefMatch) {
          calendars.push({
            url: hrefMatch[1],
            displayName: displayNameMatch ? displayNameMatch[1] : 'Calendar',
            description: descriptionMatch ? descriptionMatch[1] : undefined
          })
        }
      }
    }
    
    return calendars
  }

  /**
   * Parse CalDAV XML response to extract events
   */
  private parseEventsFromXML(xml: string): CalendarEvent[] {
    const events: CalendarEvent[] = []
    
    // Extract all response elements
    const responseRegex = /<(?:d:)?response>([\s\S]*?)<\/(?:d:)?response>/gi
    let match
    
    while ((match = responseRegex.exec(xml)) !== null) {
      const responseXml = match[1]
      
      // Extract href and etag
      const hrefMatch = responseXml.match(/<(?:d:)?href>([^<]+)<\/(?:d:)?href>/)
      const etagMatch = responseXml.match(/<(?:d:)?getetag>([^<]+)<\/(?:d:)?getetag>/)
      const calDataMatch = responseXml.match(/<(?:cal:|c:)?calendar-data[^>]*>([\s\S]*?)<\/(?:cal:|c:)?calendar-data>/)
      
      if (hrefMatch && calDataMatch) {
        try {
          const icalData = calDataMatch[1].trim()
          const jcalData = ICAL.parse(icalData)
          const comp = new ICAL.Component(jcalData)
          const vevent = comp.getFirstSubcomponent('vevent')
          
          if (vevent) {
            const icalEvent = new ICAL.Event(vevent)
            
            const event: CalendarEvent = {
              id: `caldav-${icalEvent.uid}`,
              uid: icalEvent.uid,
              title: icalEvent.summary || 'Untitled Event',
              description: icalEvent.description || '',
              location: icalEvent.location || '',
              startDate: formatISO(icalEvent.startDate.toJSDate()),
              endDate: formatISO(icalEvent.endDate.toJSDate()),
              allDay: icalEvent.startDate.isDate,
              source: 'caldav',
              caldavHref: hrefMatch[1],
              etag: etagMatch ? etagMatch[1].replace(/"/g, '') : undefined,
              syncStatus: 'synced',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              syncedAt: new Date().toISOString()
            }
            
            events.push(event)
          }
        } catch (error) {
          console.error('Failed to parse event:', error)
        }
      }
    }
    
    return events
  }
}