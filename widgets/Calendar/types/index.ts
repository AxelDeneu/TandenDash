export interface CalendarEvent {
  id: string
  title: string
  description?: string
  location?: string
  startDate: string // ISO 8601 format
  endDate: string   // ISO 8601 format
  allDay: boolean
  color?: string
  category?: string
  // Recurrence
  recurrenceRule?: string // RRULE string
  recurrenceExceptions?: string[] // ISO 8601 dates
  // Source
  source: 'local' | 'ical' | 'google'
  sourceId?: string
  sourceUrl?: string
  // Metadata
  createdAt: string
  updatedAt: string
  syncedAt?: string
}

export interface CalendarView {
  type: 'month' | 'week' | 'day' | 'list'
  currentDate: Date
  startDate: Date
  endDate: Date
}

export interface CalendarDay {
  date: number
  month: number
  year: number
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  isWeekend: boolean
  events?: CalendarEvent[]
}

export interface CalendarWeek {
  weekNumber: number
  days: CalendarDay[]
}

export interface CalendarSyncStatus {
  isSyncing: boolean
  lastSync?: string
  error?: string
  totalEvents: number
  syncedEvents: number
}

export interface CalendarPreferences {
  defaultView: 'month' | 'week' | 'day' | 'list'
  weekStartsOn: 0 | 1 // 0 = Sunday, 1 = Monday
  show24Hours: boolean
  showWeekNumbers: boolean
  defaultEventDuration: number // minutes
  defaultEventColor: string
  eventCategories: Array<{
    name: string
    color: string
  }>
}