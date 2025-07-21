import { ref, computed, onMounted, onUnmounted } from 'vue'
// @ts-ignore - ical.js doesn't have types
import ICAL from 'ical.js'
import type { CalendarEvent } from '../types'
import { useCalendarEvents } from './useCalendarEvents'
import { formatISO } from '../utils/date-helpers'
import { parseISO } from 'date-fns'

export interface SyncConfig {
  url: string
  interval: number // minutes
  enabled: boolean
}

export interface SyncStatus {
  lastSync: Date | null
  syncing: boolean
  error: string | null
  eventsCount: number
}

export function useCalendarSync(
  widgetInstanceId: number,
  config: SyncConfig
) {
  const events = useCalendarEvents(widgetInstanceId)
  
  // State
  const status = ref<SyncStatus>({
    lastSync: null,
    syncing: false,
    error: null,
    eventsCount: 0
  })
  
  let syncInterval: number | null = null
  
  // Parse iCal data
  async function parseICalData(icalData: string): Promise<Partial<CalendarEvent>[]> {
    try {
      const jcalData = ICAL.parse(icalData)
      const comp = new ICAL.Component(jcalData)
      const vevents = comp.getAllSubcomponents('vevent')
      
      const parsedEvents: Partial<CalendarEvent>[] = []
      
      for (const vevent of vevents) {
        const event = new ICAL.Event(vevent)
        
        // Extract event data
        const startDate = event.startDate.toJSDate()
        const endDate = event.endDate.toJSDate()
        
        const parsedEvent: Partial<CalendarEvent> = {
          title: event.summary || 'Untitled Event',
          description: event.description || '',
          startDate: formatISO(startDate),
          endDate: formatISO(endDate),
          allDay: event.isAllDay(),
          category: 'Synced',
          color: '#6b7280', // Gray color for synced events
          source: 'ical'
        }
        
        // Handle recurring events
        if (event.isRecurring()) {
          const iterator = event.iterator()
          let next = iterator.next()
          let count = 0
          const maxOccurrences = 50 // Limit recurring events
          
          while (next && count < maxOccurrences) {
            const occurrence = event.getOccurrenceDetails(next)
            const recurringEvent = {
              ...parsedEvent,
              startDate: formatISO(occurrence.startDate.toJSDate()),
              endDate: formatISO(occurrence.endDate.toJSDate()),
              recurringId: `${event.uid}-${count}`
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
    } catch (error) {
      console.error('Failed to parse iCal data:', error)
      throw new Error('Invalid iCal format')
    }
  }
  
  // Fetch iCal data
  async function fetchICalData(url: string): Promise<string> {
    try {
      // Use server-side proxy to avoid CORS issues
      const response = await $fetch('/api/calendar/proxy', {
        method: 'POST',
        body: { url }
      })
      
      if (typeof response !== 'string') {
        throw new Error('Invalid response format')
      }
      
      return response
    } catch (error) {
      console.error('Failed to fetch iCal data:', error)
      throw new Error('Failed to fetch calendar data')
    }
  }
  
  // Sync calendar
  async function syncCalendar() {
    if (!config.enabled || !config.url) return
    
    try {
      status.value.syncing = true
      status.value.error = null
      
      // Fetch iCal data
      const icalData = await fetchICalData(config.url)
      
      // Parse events
      const parsedEvents = await parseICalData(icalData)
      
      // Clear existing synced events
      const existingEvents = events.allEvents.value
      const syncedEvents = existingEvents.filter((e) => e.source === 'ical')
      
      for (const event of syncedEvents) {
        await events.deleteEvent(event.id)
      }
      
      // Add new synced events
      for (const eventData of parsedEvents) {
        await events.createEvent(eventData as Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>)
      }
      
      status.value.lastSync = new Date()
      status.value.eventsCount = parsedEvents.length
    } catch (error) {
      status.value.error = error instanceof Error ? error.message : 'Sync failed'
      console.error('Calendar sync failed:', error)
    } finally {
      status.value.syncing = false
    }
  }
  
  // Schedule sync
  function scheduleSyncInterval() {
    if (!config.enabled || !config.interval) return
    
    // Clear existing interval
    if (syncInterval !== null) {
      clearInterval(syncInterval)
    }
    
    // Initial sync
    syncCalendar()
    
    // Schedule periodic sync
    const intervalMs = config.interval * 60 * 1000
    syncInterval = window.setInterval(() => {
      syncCalendar()
    }, intervalMs)
  }
  
  // Computed properties
  const canSync = computed(() => {
    return config.enabled && !!config.url && !status.value.syncing
  })
  
  const nextSyncTime = computed(() => {
    if (!status.value.lastSync || !config.interval) return null
    
    const nextSync = new Date(status.value.lastSync)
    nextSync.setMinutes(nextSync.getMinutes() + config.interval)
    return nextSync
  })
  
  // Lifecycle
  onMounted(() => {
    scheduleSyncInterval()
  })
  
  onUnmounted(() => {
    if (syncInterval !== null) {
      clearInterval(syncInterval)
    }
  })
  
  return {
    // State
    status: computed(() => status.value),
    canSync,
    nextSyncTime,
    
    // Methods
    syncCalendar,
    scheduleSyncInterval
  }
}