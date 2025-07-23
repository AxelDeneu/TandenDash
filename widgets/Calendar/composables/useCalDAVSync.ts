import { ref, computed, watch, onUnmounted } from 'vue'
import type { CalDAVSyncResult } from '../types'
import type { SyncStatus } from './useCalendarSync'
import { useCalendarEvents } from './useCalendarEvents'
import { formatISO } from '../utils/date-helpers'

export interface CalDAVSyncConfig {
  enabled: boolean
  serverUrl: string
  username: string
  password: string
  calendarUrl?: string
  interval: number // minutes
}

export function useCalDAVSync(
  widgetInstanceId: number,
  config: CalDAVSyncConfig
) {
  const events = useCalendarEvents(widgetInstanceId)
  
  // State
  const status = ref<SyncStatus>({
    lastSync: null,
    syncing: false,
    error: null,
    eventsCount: 0
  })
  
  const lastSyncResult = ref<CalDAVSyncResult | null>(null)
  const testResult = ref<{ success: boolean; message: string; calendars: any[] } | null>(null)
  const testing = ref(false)
  
  let syncInterval: number | null = null
  let lastSyncTime: number | null = null
  
  // Computed properties
  const nextSyncTime = computed(() => {
    if (!config.enabled || !config.interval || !lastSyncTime) return null
    return new Date(lastSyncTime + config.interval * 60 * 1000)
  })
  
  const canSync = computed(() => {
    return config.enabled && 
           !!config.serverUrl && 
           !!config.username && 
           !!config.password &&
           !status.value.syncing
  })
  
  const hasConflicts = computed(() => {
    return lastSyncResult.value?.conflicts && lastSyncResult.value.conflicts.length > 0
  })
  
  // Test CalDAV connection
  async function testConnection() {
    if (!config.serverUrl || !config.username || !config.password) {
      testResult.value = {
        success: false,
        message: 'Please provide server URL, username and password',
        calendars: []
      }
      return
    }
    
    try {
      testing.value = true
      testResult.value = null
      
      const response = await $fetch('/api/widgets/calendar/caldav-test', {
        method: 'POST',
        body: {
          serverUrl: config.serverUrl,
          username: config.username,
          password: config.password
        }
      })
      
      testResult.value = response as any
    } catch (error: any) {
      console.error('CalDAV test failed:', error)
      testResult.value = {
        success: false,
        message: error.data?.error || error.message || 'Connection test failed',
        calendars: []
      }
    } finally {
      testing.value = false
    }
  }
  
  // Sync with CalDAV server
  async function syncCalDAV(customStartDate?: Date, customEndDate?: Date) {
    if (!canSync.value) return
    
    try {
      status.value.syncing = true
      status.value.error = null
      
      // Calculate date range
      let startDate: Date
      let endDate: Date
      
      if (customStartDate && customEndDate) {
        startDate = customStartDate
        endDate = customEndDate
      } else {
        const now = new Date()
        startDate = new Date(now)
        startDate.setMonth(startDate.getMonth() - 6)
        endDate = new Date(now)
        endDate.setMonth(endDate.getMonth() + 6)
      }
      
      // Call CalDAV sync endpoint
      const response = await $fetch<CalDAVSyncResult>('/api/widgets/calendar/caldav-sync', {
        method: 'POST',
        body: {
          widgetInstanceId,
          config: {
            serverUrl: config.serverUrl,
            username: config.username,
            password: config.password,
            calendarUrl: config.calendarUrl
          },
          startDate: formatISO(startDate),
          endDate: formatISO(endDate)
        }
      })
      
      lastSyncResult.value = response
      
      // Refresh events from database
      await events.refreshEvents()
      
      status.value.lastSync = new Date()
      status.value.eventsCount = response.syncedEvents
      lastSyncTime = Date.now()
      
      // Handle conflicts if any
      if (response.conflicts.length > 0) {
        status.value.error = `${response.conflicts.length} conflict(s) detected`
      }
      
      // Handle errors if any
      if (response.errors.length > 0) {
        console.error('CalDAV sync errors:', response.errors)
        status.value.error = `Sync completed with ${response.errors.length} error(s)`
      }
      
    } catch (error: any) {
      status.value.error = error.data?.error || error.message || 'CalDAV sync failed'
      console.error('CalDAV sync failed:', error)
    } finally {
      status.value.syncing = false
    }
  }
  
  // Schedule sync interval
  function scheduleSyncInterval() {
    if (!config.enabled || !config.interval) return
    
    // Clear existing interval
    if (syncInterval !== null) {
      window.clearInterval(syncInterval)
    }
    
    // Schedule new interval
    syncInterval = window.setInterval(() => {
      syncCalDAV()
    }, config.interval * 60 * 1000)
    
    // Sync immediately
    syncCalDAV()
  }
  
  // Stop sync
  function stopSync() {
    if (syncInterval !== null) {
      window.clearInterval(syncInterval)
      syncInterval = null
    }
  }
  
  // Toggle sync
  function toggleSync(enabled: boolean) {
    config.enabled = enabled
    
    if (enabled) {
      scheduleSyncInterval()
    } else {
      stopSync()
    }
  }
  
  // Resolve conflict
  async function resolveConflict(
    conflictIndex: number, 
    resolution: 'local' | 'remote' | 'merge'
  ) {
    if (!lastSyncResult.value?.conflicts[conflictIndex]) return
    
    const conflict = lastSyncResult.value.conflicts[conflictIndex]
    conflict.resolution = resolution
    
    // Re-sync to apply resolution
    await syncCalDAV()
  }
  
  // Watch for config changes
  watch(() => config.enabled, (enabled) => {
    if (enabled) {
      scheduleSyncInterval()
    } else {
      stopSync()
    }
  })
  
  // Initialize
  if (config.enabled) {
    scheduleSyncInterval()
  }
  
  // Cleanup
  onUnmounted(() => {
    stopSync()
  })
  
  return {
    // State
    status: readonly(status),
    lastSyncResult: readonly(lastSyncResult),
    testResult: readonly(testResult),
    testing: readonly(testing),
    nextSyncTime: readonly(nextSyncTime),
    canSync: readonly(canSync),
    hasConflicts: readonly(hasConflicts),
    
    // Methods
    testConnection,
    syncCalDAV,
    toggleSync,
    stopSync,
    resolveConflict,
    scheduleSyncInterval
  }
}