import { ref, computed, type Ref } from 'vue'
import { nanoid } from 'nanoid'
import { useWidgetData } from '@/composables'
import type { CalendarEvent } from '../types'
import { isEventInDay, groupEventsByDay } from '../utils/date-helpers'

export function useCalendarEvents(widgetInstanceId: number) {
  const widgetData = useWidgetData(widgetInstanceId)
  
  // Local state
  const selectedEvent = ref<CalendarEvent | null>(null)
  const filter = ref({
    categories: [] as string[],
    sources: [] as ('local' | 'ical' | 'google')[],
    searchQuery: ''
  })
  
  // Get all events
  const events = computed<CalendarEvent[]>(() => {
    return widgetData.get<CalendarEvent[]>('events') || []
  })
  
  // Get synced events from external sources
  const syncedEvents = computed<CalendarEvent[]>(() => {
    return widgetData.get<CalendarEvent[]>('syncedEvents') || []
  })
  
  // Combine all events
  const allEvents = computed<CalendarEvent[]>(() => {
    const localEvents = events.value
    const external = syncedEvents.value
    
    // Merge and deduplicate by sourceId if present
    const eventMap = new Map<string, CalendarEvent>()
    
    // Add local events first (they have priority)
    localEvents.forEach(event => {
      eventMap.set(event.id, event)
    })
    
    // Add synced events if they don't conflict
    external.forEach(event => {
      if (event.sourceId && !eventMap.has(event.sourceId)) {
        eventMap.set(event.sourceId, event)
      }
    })
    
    return Array.from(eventMap.values())
  })
  
  // Filtered events
  const filteredEvents = computed<CalendarEvent[]>(() => {
    let result = allEvents.value
    
    // Filter by categories
    if (filter.value.categories.length > 0) {
      result = result.filter(event => 
        event.category && filter.value.categories.includes(event.category)
      )
    }
    
    // Filter by sources
    if (filter.value.sources.length > 0) {
      result = result.filter(event => 
        filter.value.sources.includes(event.source)
      )
    }
    
    // Filter by search query
    if (filter.value.searchQuery) {
      const query = filter.value.searchQuery.toLowerCase()
      result = result.filter(event =>
        event.title.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        event.location?.toLowerCase().includes(query)
      )
    }
    
    return result
  })
  
  // Create a new event
  async function createEvent(eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt' | 'source'>): Promise<CalendarEvent> {
    const newEvent: CalendarEvent = {
      ...eventData,
      id: nanoid(),
      source: 'local',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    const currentEvents = events.value
    await widgetData.set('events', [...currentEvents, newEvent])
    
    return newEvent
  }
  
  // Update an event
  async function updateEvent(eventId: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent | null> {
    const currentEvents = events.value
    const index = currentEvents.findIndex(e => e.id === eventId)
    
    if (index === -1) return null
    
    const updatedEvent: CalendarEvent = {
      ...currentEvents[index],
      ...updates,
      updatedAt: new Date().toISOString()
    }
    
    const newEvents = [...currentEvents]
    newEvents[index] = updatedEvent
    
    await widgetData.set('events', newEvents)
    
    return updatedEvent
  }
  
  // Delete an event
  async function deleteEvent(eventId: string): Promise<boolean> {
    const currentEvents = events.value
    const filtered = currentEvents.filter(e => e.id !== eventId)
    
    if (filtered.length === currentEvents.length) return false
    
    await widgetData.set('events', filtered)
    
    return true
  }
  
  // Get events for a specific date
  function getEventsForDate(date: Date): CalendarEvent[] {
    return filteredEvents.value.filter(event => isEventInDay(event, date))
  }
  
  // Get events for a date range
  function getEventsForDateRange(startDate: Date, endDate: Date): CalendarEvent[] {
    return filteredEvents.value.filter(event => {
      const eventStart = new Date(event.startDate)
      const eventEnd = new Date(event.endDate)
      
      return (eventStart >= startDate && eventStart <= endDate) ||
             (eventEnd >= startDate && eventEnd <= endDate) ||
             (eventStart <= startDate && eventEnd >= endDate)
    })
  }
  
  // Group events by day for a date range
  function getEventsByDay(startDate: Date, endDate: Date): Map<string, CalendarEvent[]> {
    const eventsInRange = getEventsForDateRange(startDate, endDate)
    return groupEventsByDay(eventsInRange, startDate, endDate) as Map<string, CalendarEvent[]>
  }
  
  // Get upcoming events
  function getUpcomingEvents(limit = 10): CalendarEvent[] {
    const now = new Date()
    return filteredEvents.value
      .filter(event => new Date(event.startDate) >= now)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, limit)
  }
  
  // Set filter
  function setFilter(newFilter: Partial<typeof filter.value>) {
    filter.value = { ...filter.value, ...newFilter }
  }
  
  // Clear filter
  function clearFilter() {
    filter.value = {
      categories: [],
      sources: [],
      searchQuery: ''
    }
  }
  
  // Get unique categories
  const categories = computed(() => {
    const cats = new Set<string>()
    allEvents.value.forEach(event => {
      if (event.category) cats.add(event.category)
    })
    return Array.from(cats)
  })
  
  // Get event counts by source
  const eventCounts = computed(() => {
    const counts = {
      local: 0,
      ical: 0,
      google: 0,
      total: allEvents.value.length
    }
    
    allEvents.value.forEach(event => {
      counts[event.source]++
    })
    
    return counts
  })
  
  return {
    // State
    events: readonly(events),
    syncedEvents: readonly(syncedEvents),
    allEvents: readonly(allEvents),
    filteredEvents: readonly(filteredEvents),
    selectedEvent,
    filter: readonly(filter),
    categories: readonly(categories),
    eventCounts: readonly(eventCounts),
    
    // Methods
    createEvent,
    updateEvent,
    deleteEvent,
    getEventsForDate,
    getEventsForDateRange,
    getEventsByDay,
    getUpcomingEvents,
    setFilter,
    clearFilter,
    
    // Widget data access
    loading: widgetData.loading,
    error: widgetData.error
  }
}