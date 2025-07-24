<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ChevronLeft, ChevronRight, Calendar, CalendarDays, List, Plus, RefreshCw } from '@/lib/icons'
import type { WidgetConfig } from './definition'
import { WidgetPlugin } from './plugin'
import CalendarMonth from './components/views/CalendarMonth.vue'
import CalendarWeek from './components/views/CalendarWeek.vue'
import CalendarDay from './components/views/CalendarDay.vue'
import CalendarList from './components/views/CalendarList.vue'
import EventModal from './components/EventModal.vue'
import { useCalendarViews } from './composables/useCalendarViews'
import { useCalendarEvents } from './composables/useCalendarEvents'
import { useCalendarSync } from './composables/useCalendarSync'
import { useCalDAVSync } from './composables/useCalDAVSync'
import type { CalendarEvent } from './types'

interface Props extends WidgetConfig {
  id?: number
}

const props = defineProps<Props>()

// i18n
const { t } = useWidgetI18n(WidgetPlugin.id)

// Composables - Simple direct initialization
const views = useCalendarViews(props.defaultView, props.firstDayOfWeek === 'monday' ? 1 : 0)
const events = useCalendarEvents(props.id!)  // ID always exists for widget instances

// Use different sync based on sync type
const syncIcal = props.syncEnabled && props.syncType === 'readonly' ? useCalendarSync(props.id!, {
  url: props.syncUrl || '',
  interval: props.syncInterval,
  enabled: props.syncEnabled
}) : null

const syncCalDAV = props.syncEnabled && props.syncType === 'bidirectional' ? useCalDAVSync(props.id!, {
  enabled: props.syncEnabled,
  serverUrl: props.caldavCalendarUrl || '',
  username: props.caldavUsername || '',
  password: props.caldavPassword || '',
  interval: props.syncInterval
}) : null

// Unified sync interface
const sync = syncIcal || syncCalDAV

// Setup CalDAV sync callback if using bidirectional sync
if (syncCalDAV) {
  events.onCalDAVSync(async (action, event) => {
    // Trigger immediate sync for the changed event
    await syncCalDAV.syncCalDAV()
  })
}

// Modal state
const showEventModal = ref(false)
const editingEvent = ref<CalendarEvent | null>(null)
const modalInitialDate = ref<Date | null>(null)

// Get events for current view
const viewEvents = computed(() => {
  if (!props.showEvents) return []
  
  switch (views.viewType.value) {
    case 'month':
    case 'week':
    case 'day':
      return events.getEventsForDateRange(
        views.viewBounds.value.start,
        views.viewBounds.value.end
      ) || []
    case 'list':
      return events.getUpcomingEvents(30) || []
    default:
      return []
  }
})

// View icon
const viewIcon = computed(() => {
  switch (views.viewType.value) {
    case 'month':
      return Calendar
    case 'week':
      return CalendarDays
    case 'day':
      return CalendarDays
    case 'list':
      return List
    default:
      return Calendar
  }
})

// Handle date selection
function handleDateSelect(date: Date) {
  views.selectDate(date)
  if (views.viewType.value === 'month' && props.showEvents) {
    // Switch to day view when clicking a date in month view
    views.switchView('day')
    views.navigateToDate(date)
  }
}

// Handle event selection
function handleEventSelect(event: CalendarEvent) {
  if (props.allowEventEditing) {
    editingEvent.value = event
    showEventModal.value = true
  }
}

// Handle event creation
function handleEventCreate(date: Date, hour?: number) {
  if (!props.allowEventCreation || !props.showEvents) return
  
  modalInitialDate.value = date
  editingEvent.value = null
  showEventModal.value = true
}

// Handle event save
async function handleEventSave(eventData: Partial<CalendarEvent>) {
  if (editingEvent.value) {
    // Update existing event
    await events.updateEvent(editingEvent.value.id, eventData)
  } else {
    // Create new event
    await events.createEvent(eventData as Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt' | 'source'>)
  }
  
  showEventModal.value = false
  editingEvent.value = null
  modalInitialDate.value = null
}

// Handle event delete
async function handleEventDelete() {
  if (editingEvent.value && props.allowEventDeletion) {
    await events.deleteEvent(editingEvent.value.id)
    showEventModal.value = false
    editingEvent.value = null
  }
}

// Switch view
function switchToView(view: 'month' | 'week' | 'day' | 'list') {
  views.switchView(view)
}
</script>

<template>
  <div 
    class="h-full w-full flex flex-col"
    :class="[
      backgroundColor,
      textColor,
      borderColor,
      'rounded-lg overflow-hidden'
    ]"
  >
    <!-- Calendar Header -->
    <div 
      v-if="showMonthYear"
      class="p-4 flex items-center justify-between border-b"
      :class="headerColor"
    >
      <!-- Navigation -->
      <div class="flex items-center gap-2">
        <button
          v-if="navigationButtons && views.canNavigate.value"
          @click="views.navigatePrevious()"
          class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          :aria-label="t('navigation.previous')"
        >
          <ChevronLeft class="w-5 h-5" />
        </button>
        
        <button
          v-if="navigationButtons && views.canNavigate.value"
          @click="views.navigateToToday()"
          class="px-3 py-1.5 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {{ t('navigation.today') }}
        </button>
        
        <button
          v-if="navigationButtons && views.canNavigate.value"
          @click="views.navigateNext()"
          class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          :aria-label="t('navigation.next')"
        >
          <ChevronRight class="w-5 h-5" />
        </button>
      </div>
      
      <!-- Title -->
      <h2 class="text-xl font-semibold">
        {{ views.viewTitle.value }}
      </h2>
      
      <!-- View switcher and actions -->
      <div class="flex items-center gap-2">
        <!-- Sync status indicator -->
        <div
          v-if="syncEnabled && sync?.status.lastSync"
          class="flex items-center gap-1 text-sm text-muted-foreground"
          :title="`${t('sync.lastSynced')} ${sync?.status.lastSync.toLocaleString()}`"
        >
          <RefreshCw 
            class="w-4 h-4" 
            :class="{ 'animate-spin': sync?.status.syncing }"
          />
          <span v-if="!sync?.status.syncing">
            {{ sync?.status.eventsCount }} {{ t('sync.synced') }}
          </span>
        </div>
        <!-- View buttons -->
        <div class="flex items-center rounded-md border divide-x">
          <button
            @click="switchToView('month')"
            class="px-3 py-1.5 text-sm transition-colors"
            :class="views.viewType.value === 'month' ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-100 dark:hover:bg-gray-800'"
            :title="t('views.monthView')"
          >
            {{ t('views.month') }}
          </button>
          <button
            @click="switchToView('week')"
            class="px-3 py-1.5 text-sm transition-colors"
            :class="views.viewType.value === 'week' ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-100 dark:hover:bg-gray-800'"
            :title="t('views.weekView')"
          >
            {{ t('views.week') }}
          </button>
          <button
            @click="switchToView('day')"
            class="px-3 py-1.5 text-sm transition-colors"
            :class="views.viewType.value === 'day' ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-100 dark:hover:bg-gray-800'"
            :title="t('views.dayView')"
          >
            {{ t('views.day') }}
          </button>
          <button
            v-if="showEvents"
            @click="switchToView('list')"
            class="px-3 py-1.5 text-sm transition-colors"
            :class="views.viewType.value === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-100 dark:hover:bg-gray-800'"
            :title="t('views.listView')"
          >
            {{ t('views.list') }}
          </button>
        </div>
        
        <!-- Add event button -->
        <button
          v-if="showEvents && allowEventCreation"
          @click="handleEventCreate(views.selectedDate.value || new Date())"
          class="p-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          :title="t('event.addEvent')"
        >
          <Plus class="w-5 h-5" />
        </button>
      </div>
    </div>
    
    <!-- Calendar Views -->
    <div class="flex-1 min-h-0 p-4">
      <!-- Month View -->
      <CalendarMonth
        v-if="views.viewType.value === 'month'"
        :current-date="views.currentDate.value"
        :selected-date="views.selectedDate.value"
        :events="viewEvents"
        :show-week-numbers="showWeekNumbers"
        :week-starts-on="firstDayOfWeek === 'monday' ? 1 : 0"
        :compact-mode="compactMode"
        :highlight-today="highlightToday"
        :today-color="todayColor"
        :weekend-color="weekendColor"
        :font-size="fontSize"
        @select-date="handleDateSelect"
        @select-event="handleEventSelect"
      />
      
      <!-- Week View -->
      <CalendarWeek
        v-else-if="views.viewType.value === 'week'"
        :current-date="views.currentDate.value"
        :selected-date="views.selectedDate.value"
        :events="viewEvents"
        :week-starts-on="firstDayOfWeek === 'monday' ? 1 : 0"
        :show-24-hours="show24Hours"
        :font-size="fontSize"
        @select-date="handleDateSelect"
        @select-event="handleEventSelect"
        @create-event="handleEventCreate"
      />
      
      <!-- Day View -->
      <CalendarDay
        v-else-if="views.viewType.value === 'day'"
        :current-date="views.currentDate.value"
        :events="viewEvents"
        :show-24-hours="show24Hours"
        :font-size="fontSize"
        @select-event="handleEventSelect"
        @create-event="handleEventCreate"
      />
      
      <!-- List View -->
      <CalendarList
        v-else-if="views.viewType.value === 'list'"
        :events="viewEvents"
        :show-24-hours="show24Hours"
        :font-size="fontSize"
        @select-event="handleEventSelect"
      />
    </div>
    
    <!-- Event Modal -->
    <EventModal
      v-if="showEvents"
      v-model="showEventModal"
      :event="editingEvent"
      :initial-date="modalInitialDate"
      :categories="eventCategories"
      :event-colors="eventColors"
      :default-duration="defaultEventDuration"
      :default-color="defaultEventColor"
      @save="handleEventSave"
      @delete="handleEventDelete"
    />
  </div>
</template>