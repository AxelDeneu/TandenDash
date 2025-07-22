<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getCalendarMonth, getWeekNumber } from '../../utils/date-helpers'
import type { CalendarEvent, CalendarDay } from '../../types'
import translations from '../../lang/index'

interface Props {
  currentDate: Date
  selectedDate: Date | null
  events: CalendarEvent[]
  showWeekNumbers: boolean
  weekStartsOn: 0 | 1
  compactMode: boolean
  highlightToday: boolean
  todayColor: string
  weekendColor: string
  fontSize: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'select-date': [date: Date]
  'select-event': [event: CalendarEvent]
}>()

// Merge translations immediately
const { mergeLocaleMessage } = useI18n()
Object.entries(translations).forEach(([lang, messages]) => {
  mergeLocaleMessage(lang, { widget_Calendar: messages })
})

// Get calendar days
const calendarDays = computed(() => {
  return getCalendarMonth(props.currentDate, props.weekStartsOn)
})

// Day names
const dayNames = computed(() => {
  const names = props.compactMode ? 
    [t('weekDays.sun'), t('weekDays.mon'), t('weekDays.tue'), t('weekDays.wed'), t('weekDays.thu'), t('weekDays.fri'), t('weekDays.sat')] :
    [t('weekDays.sunday'), t('weekDays.monday'), t('weekDays.tuesday'), t('weekDays.wednesday'), t('weekDays.thursday'), t('weekDays.friday'), t('weekDays.saturday')]
  
  // Adjust for Monday start
  if (props.weekStartsOn === 1) {
    return [...names.slice(1), names[0]]
  }
  return names
})

// Group days by week
const calendarWeeks = computed(() => {
  const weeks = []
  const days = calendarDays.value
  
  for (let i = 0; i < days.length; i += 7) {
    const weekDays = days.slice(i, i + 7)
    weeks.push({
      weekNumber: getWeekNumber(weekDays[0].fullDate, props.weekStartsOn),
      days: weekDays.map(day => ({
        ...day,
        isSelected: props.selectedDate ? 
          day.date === props.selectedDate.getDate() &&
          day.month === props.selectedDate.getMonth() &&
          day.year === props.selectedDate.getFullYear() : false,
        events: props.events.filter(event => {
          const eventStart = new Date(event.startDate)
          return eventStart.getDate() === day.date &&
                 eventStart.getMonth() === day.month &&
                 eventStart.getFullYear() === day.year
        })
      }))
    })
  }
  
  return weeks
})

// Get day classes
const getDayClasses = (day: any) => {
  const classes = []
  
  if (!day.isCurrentMonth) {
    classes.push('text-muted-foreground opacity-50')
  }
  
  if (day.isWeekend && day.isCurrentMonth) {
    classes.push(props.weekendColor)
  }
  
  if (day.isSelected) {
    classes.push('bg-primary text-primary-foreground')
  } else if (day.isToday && props.highlightToday) {
    classes.push(props.todayColor, 'text-white')
  } else {
    classes.push('hover:bg-gray-100 dark:hover:bg-gray-800')
  }
  
  return classes
}

// Handle date selection
const selectDate = (day: any) => {
  emit('select-date', day.fullDate)
}

// Handle event click
const selectEvent = (event: CalendarEvent, e: Event) => {
  e.stopPropagation()
  emit('select-event', event)
}
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Days of week header -->
    <div 
      class="grid gap-1 mb-2 text-center font-medium text-sm"
      :class="showWeekNumbers ? 'grid-cols-8' : 'grid-cols-7'"
    >
      <!-- Week number header -->
      <div v-if="showWeekNumbers" class="text-muted-foreground">
        W#
      </div>
      
      <!-- Day headers -->
      <div
        v-for="(day, index) in dayNames"
        :key="index"
        :class="(weekStartsOn === 0 ? (index === 0 || index === 6) : (index === 5 || index === 6)) ? weekendColor : ''"
      >
        {{ day }}
      </div>
    </div>
    
    <!-- Calendar weeks -->
    <div class="flex-1 space-y-1">
      <div 
        v-for="(week, weekIndex) in calendarWeeks" 
        :key="weekIndex"
        class="grid gap-1"
        :class="showWeekNumbers ? 'grid-cols-8' : 'grid-cols-7'"
      >
        <!-- Week number -->
        <div
          v-if="showWeekNumbers"
          class="flex items-center justify-center text-xs text-muted-foreground"
        >
          {{ week.weekNumber }}
        </div>
        
        <!-- Days -->
        <div
          v-for="(day, dayIndex) in week.days"
          :key="`${weekIndex}-${dayIndex}`"
          class="relative aspect-square flex flex-col items-center justify-center rounded-md transition-colors cursor-pointer p-1"
          :class="getDayClasses(day)"
          @click="selectDate(day)"
        >
          <span :style="{ fontSize: `${fontSize}px` }">
            {{ day.date }}
          </span>
          
          <!-- Event indicators -->
          <div v-if="day.events && day.events.length > 0" class="absolute bottom-1 left-0 right-0 flex justify-center gap-0.5">
            <div
              v-for="(event, eventIndex) in day.events.slice(0, 3)"
              :key="event.id"
              class="w-1 h-1 rounded-full"
              :style="{ backgroundColor: event.color || '#3b82f6' }"
              @click="selectEvent(event, $event)"
            />
            <div v-if="day.events.length > 3" class="w-1 h-1 rounded-full bg-gray-400" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>