import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
// @ts-ignore - ical.js doesn't have types
import ICAL from 'ical.js'
import { ServiceFactory } from '../../../lib/services/ServiceFactory'
import { RepositoryFactory } from '../../../lib/repositories/RepositoryFactory'
import type { CalendarEvent } from '../types'
import { formatISO } from 'date-fns'

// Schema de validation pour la requête proxy
const ProxyRequestSchema = z.object({
  url: z.string().url().startsWith('http'),
  widgetInstanceId: z.number(),
  startDate: z.string().optional(), // ISO date string
  endDate: z.string().optional()    // ISO date string
})

// Parse iCal events
function parseICalData(icalData: string, startDate?: Date, endDate?: Date): Partial<CalendarEvent>[] {
  const jcalData = ICAL.parse(icalData)
  const comp = new ICAL.Component(jcalData)
  const vevents = comp.getAllSubcomponents('vevent')
  
  const parsedEvents: Partial<CalendarEvent>[] = []
  
  for (const vevent of vevents) {
    const event = new ICAL.Event(vevent)
    
    const eventStartDate = event.startDate.toJSDate()
    const eventEndDate = event.endDate.toJSDate()
    
    // Filter by date range if provided
    if (startDate && eventEndDate < startDate) continue
    if (endDate && eventStartDate > endDate) continue
    
    const parsedEvent: Partial<CalendarEvent> = {
      title: event.summary || 'Untitled Event',
      description: event.description || '',
      startDate: formatISO(eventStartDate),
      endDate: formatISO(eventEndDate),
      allDay: event.startDate.isDate,
      category: 'Synced',
      color: '#6b7280', // Gray color for synced events
      source: 'ical',
      uid: event.uid // Store the iCal UID for identification
    }
    
    // Handle recurring events
    if (event.isRecurring()) {
      const iterator = event.iterator()
      let next = iterator.next()
      let count = 0
      const maxOccurrences = 50 // Limit recurring events
      
      while (next && count < maxOccurrences) {
        const occurrence = event.getOccurrenceDetails(next)
        const occurrenceStart = occurrence.startDate.toJSDate()
        const occurrenceEnd = occurrence.endDate.toJSDate()
        
        // Filter by date range
        if (startDate && occurrenceEnd < startDate) {
          next = iterator.next()
          continue
        }
        if (endDate && occurrenceStart > endDate) {
          break // No need to continue, all future occurrences will be outside range
        }
        
        const recurringEvent = {
          ...parsedEvent,
          startDate: formatISO(occurrenceStart),
          endDate: formatISO(occurrenceEnd),
          uid: `${event.uid}-${formatISO(occurrenceStart)}` // Unique ID for each occurrence
        }
        parsedEvents.push(recurringEvent)
        
        next = iterator.next()
        count++
      }
    } else {
      parsedEvents.push(parsedEvent)
    }
  }
  
  return parsedEvents
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  // Validate request
  const validation = ProxyRequestSchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid request parameters',
      data: validation.error.errors
    })
  }
  
  const { url, widgetInstanceId, startDate, endDate } = validation.data
  
  // Parse date range if provided
  const dateStart = startDate ? new Date(startDate) : undefined
  const dateEnd = endDate ? new Date(endDate) : undefined
  
  try {
    // Fetch iCal data
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TandenDash Calendar Widget',
        'Accept': 'text/calendar, text/plain, */*'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const contentType = response.headers.get('content-type') || ''
    const text = await response.text()
    
    // Verify it's a valid iCal file
    if (!contentType.includes('calendar') && !contentType.includes('text/plain')) {
      if (!text.includes('BEGIN:VCALENDAR')) {
        throw new Error('Invalid calendar format: Not an iCal file')
      }
    }
    
    // Parse events with date filtering
    const parsedEvents = parseICalData(text, dateStart, dateEnd)
    
    // Get services
    const repositories = new RepositoryFactory()
    const services = new ServiceFactory(repositories)
    const widgetDataService = services.createWidgetDataService()
    
    // Get existing events from database
    console.log('Fetching existing events for widget:', widgetInstanceId)
    const existingData = await widgetDataService.getData(widgetInstanceId, 'events')
    console.log('Existing data response:', existingData)
    
    let allExistingEvents: CalendarEvent[] = []
    
    if (existingData.success && existingData.data && existingData.data.value) {
      try {
        allExistingEvents = JSON.parse(existingData.data.value)
        console.log('Parsed existing events:', allExistingEvents.length)
      } catch (e) {
        console.error('Failed to parse existing events:', e)
        allExistingEvents = []
      }
    } else {
      console.log('No existing events found')
    }
    
    // Separate manual and synced events
    const manualEvents = allExistingEvents.filter((e: any) => e.source !== 'ical')
    const existingIcalEvents = allExistingEvents.filter((e: any) => e.source === 'ical')
    
    // Create a map of existing iCal events by UID
    const existingEventsMap = new Map(
      existingIcalEvents.map((e: any) => [e.uid, e])
    )
    
    // Determine which events to keep, update, or add
    const eventsToKeep: CalendarEvent[] = []
    const eventsToAdd: Partial<CalendarEvent>[] = []
    
    for (const parsedEvent of parsedEvents) {
      const existing = parsedEvent.uid ? existingEventsMap.get(parsedEvent.uid) : null
      
      if (existing) {
        // Keep existing event (already in DB)
        eventsToKeep.push(existing)
        existingEventsMap.delete(parsedEvent.uid!)
      } else {
        // New event to add
        eventsToAdd.push(parsedEvent)
      }
    }
    
    // Events remaining in map should be deleted (no longer in iCal)
    const eventsToDelete = Array.from(existingEventsMap.values())
    
    
    // Combine all events
    const allEvents = [
      ...manualEvents,
      ...eventsToKeep,
      ...eventsToAdd.map(e => ({
        ...e,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }))
    ]
    
    // Update database with all events in a single operation
    if (allEvents.length > 0 || allExistingEvents.length > 0) {
      await widgetDataService.setData(
        widgetInstanceId,
        'events',
        JSON.stringify(allEvents)
      )
    }
    
    // Return only the events in the requested date range
    const filteredEvents = allEvents.filter((e: any) => {
      const eventStart = new Date(e.startDate)
      const eventEnd = new Date(e.endDate)
      
      if (dateStart && eventEnd < dateStart) return false
      if (dateEnd && eventStart > dateEnd) return false
      
      return true
    })
    
    return {
      events: filteredEvents,
      syncedCount: eventsToKeep.length + eventsToAdd.length,
      deletedCount: eventsToDelete.length,
      totalCount: allEvents.length
    }
    
  } catch (error) {
    console.error('Calendar proxy error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        throw createError({
          statusCode: 502,
          statusMessage: 'Failed to connect to calendar server',
          data: { error: error.message }
        })
      }
      
      throw createError({
        statusCode: 500,
        statusMessage: error.message,
        data: { error: error.message }
      })
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch calendar data',
      data: { error: 'Unknown error occurred' }
    })
  }
})