import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { ServiceFactory } from '../../../lib/services/ServiceFactory'
import { RepositoryFactory } from '../../../lib/repositories/RepositoryFactory'
import { CalDAVService } from '../services/CalDAVService'
import type { CalendarEvent, CalDAVConfig, CalDAVSyncResult } from '../types'
import { 
  encryptPassword, 
  decryptPassword, 
  generateEncryptionKey,
  detectConflicts,
  mergeEvents,
  generateCalDAVUID
} from '../utils/caldav-helpers'

// Schema de validation pour la requête de synchronisation CalDAV
const CalDAVSyncRequestSchema = z.object({
  widgetInstanceId: z.number(),
  config: z.object({
    serverUrl: z.string().url(),
    username: z.string(),
    password: z.string(),
    calendarUrl: z.string().optional()
  }),
  startDate: z.string(), // ISO date
  endDate: z.string()     // ISO date
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  // Validate request
  const validation = CalDAVSyncRequestSchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid request parameters',
      data: validation.error.errors
    })
  }
  
  const { widgetInstanceId, config, startDate, endDate } = validation.data
  
  try {
    // Get services
    const repositories = new RepositoryFactory()
    const services = new ServiceFactory(repositories)
    const widgetDataService = services.createWidgetDataService()
    
    // Initialize CalDAV service
    const caldavConfig: CalDAVConfig = {
      serverUrl: config.serverUrl,
      username: config.username,
      password: config.password,
      calendarUrl: config.calendarUrl,
      authMethod: 'basic'
    }
    
    const caldavService = new CalDAVService(caldavConfig)
    
    // Fetch remote events
    const remoteEvents = await caldavService.fetchEvents(
      new Date(startDate),
      new Date(endDate)
    )
    
    // Get local events
    const localData = await widgetDataService.getData(widgetInstanceId, 'events')
    let localEvents: CalendarEvent[] = []
    
    if (localData.success && localData.data?.value) {
      try {
        localEvents = JSON.parse(localData.data.value)
      } catch (e) {
        console.error('Failed to parse local events:', e)
        localEvents = []
      }
    }
    
    // Separate local-only events from CalDAV-synced events
    const localOnlyEvents = localEvents.filter(e => e.source === 'local' && !e.caldavHref)
    const syncedLocalEvents = localEvents.filter(e => e.source === 'caldav' || e.caldavHref)
    
    // Build maps for efficient lookup
    const remoteEventsByUID = new Map(remoteEvents.map(e => [e.uid!, e]))
    const localEventsByUID = new Map(syncedLocalEvents.map(e => [e.uid!, e]))
    
    const result: CalDAVSyncResult = {
      success: true,
      syncedEvents: 0,
      deletedEvents: 0,
      conflicts: [],
      errors: []
    }
    
    const finalEvents: CalendarEvent[] = [...localOnlyEvents]
    const pendingOperations: Array<() => Promise<void>> = []
    
    // Process remote events (download changes)
    for (const remoteEvent of remoteEvents) {
      const localEvent = localEventsByUID.get(remoteEvent.uid!)
      
      if (!localEvent) {
        // New event from server
        finalEvents.push(remoteEvent)
        result.syncedEvents++
      } else {
        // Check for conflicts
        const conflict = detectConflicts(localEvent, remoteEvent)
        
        if (conflict === 'none') {
          // No conflict, keep as is
          finalEvents.push(localEvent)
        } else {
          // Conflict detected
          result.conflicts.push({
            localEvent,
            remoteEvent,
            resolution: 'remote' // Default resolution
          })
          
          // For now, remote wins
          finalEvents.push({
            ...remoteEvent,
            id: localEvent.id // Keep local ID
          })
          result.syncedEvents++
        }
        
        localEventsByUID.delete(remoteEvent.uid!)
      }
    }
    
    // Process local events not on server (upload changes)
    for (const [uid, localEvent] of localEventsByUID) {
      if (localEvent.syncStatus === 'pending' || !localEvent.caldavHref) {
        // Upload to server
        pendingOperations.push(async () => {
          try {
            if (!localEvent.caldavHref) {
              // Create new event on server
              const eventToCreate = {
                ...localEvent,
                uid: localEvent.uid || generateCalDAVUID()
              }
              
              const { href, etag } = await caldavService.createEvent(eventToCreate)
              
              finalEvents.push({
                ...localEvent,
                caldavHref: href,
                etag,
                syncStatus: 'synced',
                syncedAt: new Date().toISOString()
              })
              
              result.syncedEvents++
            } else if (localEvent.syncStatus === 'pending') {
              // Update existing event on server
              try {
                const { etag } = await caldavService.updateEvent(localEvent)
                
                finalEvents.push({
                  ...localEvent,
                  etag,
                  syncStatus: 'synced',
                  syncedAt: new Date().toISOString()
                })
                
                result.syncedEvents++
              } catch (error: any) {
                if (error.message.includes('CONFLICT')) {
                  // Handle update conflict
                  const remoteEvent = remoteEventsByUID.get(uid)
                  if (remoteEvent) {
                    result.conflicts.push({
                      localEvent,
                      remoteEvent,
                      resolution: 'remote'
                    })
                    finalEvents.push(remoteEvent)
                  }
                } else {
                  throw error
                }
              }
            }
          } catch (error: any) {
            result.errors.push(`Failed to sync event ${localEvent.title}: ${error.message}`)
            finalEvents.push({
              ...localEvent,
              syncStatus: 'error',
              syncError: error.message
            })
          }
        })
      } else {
        // Event was deleted from server
        result.deletedEvents++
      }
    }
    
    // Process events marked for deletion
    const eventsToDelete = localEvents.filter(e => e.syncStatus === 'pending' && e.caldavHref)
    for (const event of eventsToDelete) {
      pendingOperations.push(async () => {
        try {
          await caldavService.deleteEvent(event)
          result.deletedEvents++
        } catch (error: any) {
          if (!error.message.includes('404')) {
            result.errors.push(`Failed to delete event ${event.title}: ${error.message}`)
          }
        }
      })
    }
    
    // Execute all pending operations
    if (pendingOperations.length > 0) {
      await Promise.all(pendingOperations.map(op => op()))
    }
    
    // Save updated events to database
    await widgetDataService.setData(
      widgetInstanceId,
      'events',
      JSON.stringify(finalEvents)
    )
    
    // Store encrypted CalDAV config
    const encryptionKey = generateEncryptionKey(widgetInstanceId)
    const encryptedPassword = encryptPassword(config.password, encryptionKey)
    
    await widgetDataService.setData(
      widgetInstanceId,
      'caldav_config',
      JSON.stringify({
        serverUrl: config.serverUrl,
        username: config.username,
        password: encryptedPassword,
        calendarUrl: config.calendarUrl
      })
    )
    
    return result
    
  } catch (error) {
    console.error('CalDAV sync error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('authenticate')) {
        throw createError({
          statusCode: 401,
          statusMessage: 'Authentication failed',
          data: { error: 'Invalid username or password' }
        })
      }
      
      if (error.message.includes('404')) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Calendar not found',
          data: { error: 'The specified calendar was not found' }
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
      statusMessage: 'CalDAV sync failed',
      data: { error: 'Unknown error occurred' }
    })
  }
})