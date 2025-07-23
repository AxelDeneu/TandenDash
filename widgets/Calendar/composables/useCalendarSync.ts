import { ref, readonly, computed, onMounted, onUnmounted } from 'vue'
import type { CalendarEvent } from '../types'
import { useCalendarEvents } from './useCalendarEvents'
import { formatISO } from '../utils/date-helpers'

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
  let lastSyncTime: number | null = null
  
  // Computed properties
  const nextSyncTime = computed(() => {
    if (!config.enabled || !config.interval || !lastSyncTime) return null
    return new Date(lastSyncTime + config.interval * 60 * 1000)
  })
  
  const canSync = computed(() => {
    return config.enabled && !!config.url && !status.value.syncing
  })
  
  // Sync calendar
  async function syncCalendar(customStartDate?: Date, customEndDate?: Date) {
    if (!config.enabled || !config.url) return
    
    try {
      status.value.syncing = true
      status.value.error = null
      
      // Use custom dates or calculate default range (±6 months)
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
      
      // Call the new proxy endpoint that handles sync server-side
      const response = await $fetch<{
        events: any[]
        syncedCount: number
        deletedCount: number
        totalCount: number
      }>(`/api/widgets/calendar/proxy`, {
        method: 'POST',
        body: {
          url: config.url,
          widgetInstanceId,
          startDate: formatISO(startDate),
          endDate: formatISO(endDate)
        }
      })
      
      // Refresh events from the response
      await events.refreshEvents()
      
      status.value.lastSync = new Date()
      status.value.eventsCount = response.syncedCount
      lastSyncTime = Date.now()
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
      window.clearInterval(syncInterval)
    }
    
    // Schedule new interval
    syncInterval = window.setInterval(() => {
      syncCalendar()
    }, config.interval * 60 * 1000)
    
    // Sync immediately
    syncCalendar()
  }
  
  // Stop sync
  function stopSync() {
    if (syncInterval !== null) {
      window.clearInterval(syncInterval)
      syncInterval = null
    }
  }
  
  // Enable/disable sync
  function toggleSync(enabled: boolean) {
    config.enabled = enabled
    
    if (enabled) {
      scheduleSyncInterval()
    } else {
      stopSync()
    }
  }
  
  // Initialize
  onMounted(() => {
    if (config.enabled) {
      scheduleSyncInterval()
    }
  })
  
  // Cleanup
  onUnmounted(() => {
    stopSync()
  })
  
  return {
    status: readonly(status),
    nextSyncTime: readonly(nextSyncTime),
    canSync: readonly(canSync),
    syncCalendar,
    toggleSync,
    stopSync
  }
}