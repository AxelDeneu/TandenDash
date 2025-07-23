<script setup lang="ts">
import { computed } from 'vue'
import { format, startOfWeek, addDays, isSameDay, isToday } from 'date-fns'
import { enUS, fr } from 'date-fns/locale'
import { WidgetPlugin } from '../../plugin'
import type { CalendarEvent } from '../../types'

interface Props {
  currentDate: Date
  selectedDate: Date | null
  events: CalendarEvent[]
  weekStartsOn: 0 | 1
  show24Hours: boolean
  fontSize: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'select-date': [date: Date]
  'select-event': [event: CalendarEvent]
  'create-event': [date: Date, hour: number]
}>()

// i18n
const { locale } = useWidgetI18n(WidgetPlugin.id)

// Get the appropriate date-fns locale
const dateFnsLocale = computed(() => {
  return locale.value === 'fr' ? fr : enUS
})

// Hours to display
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

// Days of the week
const weekDays = computed(() => {
  const start = startOfWeek(props.currentDate, { weekStartsOn: props.weekStartsOn })
  const days = []
  
  for (let i = 0; i < 7; i++) {
    const date = addDays(start, i)
    days.push({
      date,
      dayName: format(date, 'EEE', { locale: dateFnsLocale.value }),
      dayNumber: format(date, 'd', { locale: dateFnsLocale.value }),
      isToday: isToday(date),
      isSelected: props.selectedDate ? isSameDay(date, props.selectedDate) : false,
      events: getEventsForDay(date)
    })
  }
  
  return days
})

// Get events for a specific day
function getEventsForDay(date: Date): CalendarEvent[] {
  return props.events.filter(event => {
    const eventStart = new Date(event.startDate)
    return isSameDay(eventStart, date)
  }).sort((a, b) => 
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  )
}

// Calculate event position and height
function getEventStyle(event: CalendarEvent) {
  const start = new Date(event.startDate)
  const end = new Date(event.endDate)
  
  const startHour = start.getHours() + start.getMinutes() / 60
  const endHour = end.getHours() + end.getMinutes() / 60
  
  const duration = endHour - startHour
  const top = (startHour / 24) * 100
  const height = (duration / 24) * 100
  
  return {
    top: `${top}%`,
    height: `${Math.max(height, 2)}%`, // Minimum height for visibility
    backgroundColor: event.color || '#3b82f6',
    left: '2px',
    right: '2px'
  }
}

// Handle hour click
function handleHourClick(day: Date, hour: number) {
  const date = new Date(day)
  date.setHours(hour, 0, 0, 0)
  emit('create-event', date, hour)
}

// Handle event click
function handleEventClick(event: CalendarEvent, e: Event) {
  e.stopPropagation()
  emit('select-event', event)
}

// Format time with locale
function formatEventTime(date: string): string {
  return format(new Date(date), props.show24Hours ? 'HH:mm' : 'h:mm a', { locale: dateFnsLocale.value })
}
</script>

<template>
  <div class="h-full flex flex-col min-h-0">
    <!-- Day headers -->
    <div class="grid grid-cols-8 border-b">
      <!-- Time column header -->
      <div class="p-2 text-xs text-muted-foreground">
        <!-- Empty corner -->
      </div>
      
      <!-- Day headers -->
      <div
        v-for="day in weekDays"
        :key="day.date.toISOString()"
        class="p-2 text-center border-l cursor-pointer hover:bg-accent"
        :class="{
          'bg-primary/10': day.isSelected,
          'font-semibold': day.isToday
        }"
        @click="emit('select-date', day.date)"
      >
        <div class="text-sm">{{ day.dayName }}</div>
        <div 
          class="text-lg"
          :class="{ 'text-primary': day.isToday }"
        >
          {{ day.dayNumber }}
        </div>
      </div>
    </div>
    
    <!-- Time grid -->
    <div class="flex-1 min-h-0 overflow-auto">
      <div class="relative">
        <!-- Hour rows -->
        <div 
          v-for="hour in hours"
          :key="hour.hour"
          class="grid grid-cols-8 border-b h-16"
        >
          <!-- Hour label -->
          <div class="p-2 text-xs text-muted-foreground text-right">
            {{ hour.label }}
          </div>
          
          <!-- Hour cells -->
          <div
            v-for="(day, dayIndex) in weekDays"
            :key="`${hour.hour}-${dayIndex}`"
            class="border-l hover:bg-accent/50 cursor-pointer relative"
            @click="handleHourClick(day.date, hour.hour)"
          >
            <!-- Current time indicator -->
            <div
              v-if="day.isToday && new Date().getHours() === hour.hour"
              class="absolute top-0 left-0 right-0 h-0.5 bg-red-500"
              :style="{ top: `${(new Date().getMinutes() / 60) * 100}%` }"
            />
          </div>
        </div>
        
        <!-- Events overlay -->
        <div class="absolute inset-0 pointer-events-none">
          <div class="grid grid-cols-8 h-full">
            <!-- Empty time column -->
            <div />
            
            <!-- Event columns -->
            <div
              v-for="(day, dayIndex) in weekDays"
              :key="`events-${dayIndex}`"
              class="relative"
            >
              <div
                v-for="event in day.events"
                :key="event.id"
                class="absolute rounded px-1 py-0.5 text-xs text-white overflow-hidden cursor-pointer pointer-events-auto hover:opacity-90 shadow-sm"
                :style="getEventStyle(event)"
                @click="handleEventClick(event, $event)"
              >
                <div class="font-medium truncate">{{ event.title }}</div>
                <div v-if="getEventStyle(event).height > '4%'" class="truncate opacity-75">
                  {{ formatEventTime(event.startDate) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>