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
  source: 'local' | 'ical' | 'caldav'
  sourceId?: string
  sourceUrl?: string
  uid?: string // iCal UID for synchronization
  // CalDAV specific
  etag?: string // For conflict detection
  caldavHref?: string // Resource URL on CalDAV server
  // Sync state
  syncStatus?: 'synced' | 'pending' | 'error'
  syncError?: string
  deleted?: boolean // Soft delete for CalDAV sync
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

export interface CalDAVConfig {
  serverUrl: string
  username: string
  password: string // Encrypted
  calendarUrl?: string
  principalUrl?: string
  authMethod?: 'basic' | 'oauth2'
}

export interface CalDAVSyncResult {
  success: boolean
  syncedEvents: number
  deletedEvents: number
  conflicts: Array<{
    localEvent: CalendarEvent
    remoteEvent: CalendarEvent
    resolution?: 'local' | 'remote' | 'merge'
  }>
  errors: string[]
}