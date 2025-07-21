<script setup lang="ts">
import { computed } from 'vue'
import { format, isSameDay, startOfDay } from 'date-fns'
import type { CalendarEvent } from '../../types'

interface Props {
  events: CalendarEvent[]
  show24Hours: boolean
  fontSize: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'select-event': [event: CalendarEvent]
}>()

// Group events by day
const eventsByDay = computed(() => {
  const grouped = new Map<string, CalendarEvent[]>()
  
  // Sort events by start date
  const sortedEvents = [...props.events].sort((a, b) => 
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  )
  
  // Group by day
  sortedEvents.forEach(event => {
    const dayKey = format(new Date(event.startDate), 'yyyy-MM-dd')
    if (!grouped.has(dayKey)) {
      grouped.set(dayKey, [])
    }
    grouped.get(dayKey)!.push(event)
  })
  
  // Convert to array with date objects
  return Array.from(grouped.entries()).map(([dateStr, events]) => ({
    date: new Date(dateStr),
    events: events.sort((a, b) => {
      // All-day events first
      if (a.allDay && !b.allDay) return -1
      if (!a.allDay && b.allDay) return 1
      // Then by start time
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    })
  }))
})

// Format day header
function formatDayHeader(date: Date): string {
  const today = startOfDay(new Date())
  if (isSameDay(date, today)) {
    return `Today • ${format(date, 'EEEE, MMMM d')}`
  }
  return format(date, 'EEEE, MMMM d, yyyy')
}

// Format event time
function formatEventTime(event: CalendarEvent): string {
  if (event.allDay) {
    return 'All day'
  }
  
  const start = new Date(event.startDate)
  const end = new Date(event.endDate)
  
  const startTime = format(start, props.show24Hours ? 'HH:mm' : 'h:mm a')
  const endTime = format(end, props.show24Hours ? 'HH:mm' : 'h:mm a')
  
  // Same day
  if (isSameDay(start, end)) {
    return `${startTime} - ${endTime}`
  }
  
  // Multi-day
  return `${format(start, 'MMM d, ')}${startTime} - ${format(end, 'MMM d, ')}${endTime}`
}

// Handle event click
function handleEventClick(event: CalendarEvent) {
  emit('select-event', event)
}

// Check if date is today
function isToday(date: Date): boolean {
  return isSameDay(date, new Date())
}
</script>

<template>
  <div class="h-full overflow-auto">
    <div v-if="eventsByDay.length === 0" class="p-4 text-center text-muted-foreground">
      No upcoming events
    </div>
    
    <div v-else class="space-y-4 p-4">
      <div 
        v-for="dayGroup in eventsByDay" 
        :key="dayGroup.date.toISOString()"
        class="space-y-2"
      >
        <!-- Day header -->
        <h3 
          class="font-semibold text-sm sticky top-0 bg-background py-2"
          :class="{ 'text-primary': isToday(dayGroup.date) }"
        >
          {{ formatDayHeader(dayGroup.date) }}
        </h3>
        
        <!-- Events for this day -->
        <div class="space-y-1">
          <div
            v-for="event in dayGroup.events"
            :key="event.id"
            class="flex gap-3 p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
            @click="handleEventClick(event)"
          >
            <!-- Time column -->
            <div class="text-sm text-muted-foreground min-w-[100px]">
              {{ formatEventTime(event) }}
            </div>
            
            <!-- Event details -->
            <div class="flex-1 space-y-1">
              <div class="flex items-start gap-2">
                <!-- Color indicator -->
                <div 
                  class="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                  :style="{ backgroundColor: event.color || '#3b82f6' }"
                />
                
                <!-- Title and description -->
                <div class="flex-1">
                  <h4 class="font-medium" :style="{ fontSize: `${fontSize}px` }">
                    {{ event.title }}
                  </h4>
                  
                  <p v-if="event.description" class="text-sm text-muted-foreground line-clamp-2">
                    {{ event.description }}
                  </p>
                  
                  <div v-if="event.location" class="text-sm text-muted-foreground mt-1">
                    📍 {{ event.location }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>