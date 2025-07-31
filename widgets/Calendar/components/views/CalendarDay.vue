<script setup lang="ts">
import { computed } from 'vue'
import { format, isSameDay } from 'date-fns'
import { enUS, fr } from 'date-fns/locale'
import { WidgetPlugin } from '../../plugin'
import type { CalendarEvent } from '../../types'

interface Props {
  currentDate: Date
  events: CalendarEvent[]
  show24Hours: boolean
  fontSize: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'select-event': [event: CalendarEvent]
  'create-event': [date: Date, hour: number]
}>()

// i18n
const { locale } = useWidgetI18n(WidgetPlugin.id)

// Get the appropriate date-fns locale
const dateFnsLocale = computed(() => {
  return locale.value === 'fr' ? fr : enUS
})

// Hours array
const hours = computed(() => {
  const hoursArray = []
  for (let i = 0; i < 24; i++) {
    hoursArray.push({
      hour: i,
      label: props.show24Hours ? 
        i.toString().padStart(2, '0') + ':00' : 
        format(new Date().setHours(i, 0, 0, 0), 'h a', { locale: dateFnsLocale.value })
    })
  }
  return hoursArray
})

// Events for the current day
const dayEvents = computed(() => {
  return props.events.filter(event => {
    const eventStart = new Date(event.startDate)
    return isSameDay(eventStart, props.currentDate)
  }).sort((a, b) => 
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  )
})

// All-day events
const allDayEvents = computed(() => {
  return dayEvents.value.filter(event => event.allDay)
})

// Timed events
const timedEvents = computed(() => {
  return dayEvents.value.filter(event => !event.allDay)
})

// Calculate event style
function getEventStyle(event: CalendarEvent) {
  const start = new Date(event.startDate)
  const end = new Date(event.endDate)
  
  const startMinutes = start.getHours() * 60 + start.getMinutes()
  const endMinutes = end.getHours() * 60 + end.getMinutes()
  
  const duration = endMinutes - startMinutes
  const top = (startMinutes / (24 * 60)) * 100
  const height = (duration / (24 * 60)) * 100
  
  return {
    top: `${top}%`,
    height: `${Math.max(height, 2)}%`, // Minimum height
    backgroundColor: event.color || '#3b82f6'
  }
}

// Format event time
function formatEventTime(event: CalendarEvent) {
  const start = new Date(event.startDate)
  const end = new Date(event.endDate)
  
  const startTime = format(start, props.show24Hours ? 'HH:mm' : 'h:mm a', { locale: dateFnsLocale.value })
  const endTime = format(end, props.show24Hours ? 'HH:mm' : 'h:mm a', { locale: dateFnsLocale.value })
  
  return `${startTime} - ${endTime}`
}

// Handle hour click
function handleHourClick(hour: number) {
  const date = new Date(props.currentDate)
  date.setHours(hour, 0, 0, 0)
  emit('create-event', date, hour)
}

// Handle event click
function handleEventClick(event: CalendarEvent, e: Event) {
  e.stopPropagation()
  emit('select-event', event)
}

// Current time position
const currentTimePosition = computed(() => {
  const now = new Date()
  if (!isSameDay(now, props.currentDate)) return null
  
  const minutes = now.getHours() * 60 + now.getMinutes()
  const position = (minutes / (24 * 60)) * 100
  
  return `${position}%`
})
</script>

<template>
  <div class="h-full flex flex-col min-h-0">
    <!-- All-day events section -->
    <div v-if="allDayEvents.length > 0" class="border-b p-2">
      <div class="text-xs text-muted-foreground mb-1">All-day</div>
      <div class="space-y-1">
        <div
          v-for="event in allDayEvents"
          :key="event.id"
          class="p-2 rounded text-sm text-white cursor-pointer hover:opacity-90"
          :style="{ backgroundColor: event.color || '#3b82f6' }"
          @click="handleEventClick(event, $event)"
        >
          {{ event.title }}
        </div>
      </div>
    </div>
    
    <!-- Timed events section -->
    <div class="flex-1 min-h-0 overflow-auto [&::-webkit-scrollbar]:hidden">
      <div class="relative">
        <!-- Hour rows -->
        <div 
          v-for="hour in hours"
          :key="hour.hour"
          class="flex border-b h-16"
        >
          <!-- Hour label -->
          <div class="w-20 p-2 text-xs text-muted-foreground text-right flex-shrink-0">
            {{ hour.label }}
          </div>
          
          <!-- Hour cell -->
          <div 
            class="flex-1 border-l hover:bg-accent/50 cursor-pointer relative"
            @click="handleHourClick(hour.hour)"
          />
        </div>
        
        <!-- Events overlay -->
        <div class="absolute top-0 left-20 right-0 bottom-0 pointer-events-none">
          <div class="relative h-full">
            <!-- Timed events -->
            <div
              v-for="event in timedEvents"
              :key="event.id"
              class="absolute left-2 right-2 rounded px-2 py-1 text-white overflow-hidden cursor-pointer pointer-events-auto hover:opacity-90 shadow-sm"
              :style="getEventStyle(event)"
              @click="handleEventClick(event, $event)"
            >
              <div class="text-sm font-medium truncate">{{ event.title }}</div>
              <div v-if="getEventStyle(event).height > '4%'" class="text-xs truncate opacity-75">
                {{ formatEventTime(event) }}
              </div>
              <div v-if="event.location && getEventStyle(event).height > '6%'" class="text-xs truncate opacity-75">
                📍 {{ event.location }}
              </div>
            </div>
            
            <!-- Current time indicator -->
            <div
              v-if="currentTimePosition"
              class="absolute left-0 right-0 h-0.5 bg-red-500 pointer-events-none"
              :style="{ top: currentTimePosition }"
            >
              <div class="absolute -left-1 -top-1 w-2 h-2 bg-red-500 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>