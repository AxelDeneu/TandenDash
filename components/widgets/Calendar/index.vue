<template>
  <div 
    class="h-full w-full flex flex-col"
    :class="[
      backgroundColor,
      textColor,
      borderColor,
      'border rounded-lg overflow-hidden'
    ]"
  >
    <!-- Calendar Header -->
    <div 
      v-if="showMonthYear"
      class="p-4 flex items-center justify-between"
      :class="headerColor"
    >
      <button
        v-if="navigationButtons"
        @click="previousMonth"
        class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Previous month"
      >
        <ChevronLeft class="w-5 h-5" />
      </button>
      
      <h2 class="text-xl font-semibold">
        {{ monthYearDisplay }}
      </h2>
      
      <button
        v-if="navigationButtons"
        @click="nextMonth"
        class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Next month"
      >
        <ChevronRight class="w-5 h-5" />
      </button>
    </div>
    
    <!-- Calendar Grid -->
    <div class="flex-1 p-4">
      <!-- Days of Week Header -->
      <div class="grid grid-cols-7 gap-1 mb-2">
        <div
          v-for="(day, index) in daysOfWeek"
          :key="index"
          class="text-center font-medium text-sm"
          :class="isWeekend(index) ? weekendColor : ''"
        >
          {{ compactMode ? day.slice(0, 1) : day.slice(0, 3) }}
        </div>
      </div>
      
      <!-- Week Numbers Column + Calendar Days -->
      <div class="grid" :class="showWeekNumbers ? 'grid-cols-8' : 'grid-cols-7'" style="gap: 0.25rem">
        <template v-for="(week, weekIndex) in calendarWeeks" :key="weekIndex">
          <!-- Week Number -->
          <div
            v-if="showWeekNumbers"
            class="text-center text-xs text-muted-foreground p-1"
          >
            {{ week.weekNumber }}
          </div>
          
          <!-- Days -->
          <div
            v-for="(day, dayIndex) in week.days"
            :key="`${weekIndex}-${dayIndex}`"
            class="aspect-square flex items-center justify-center rounded-md transition-colors cursor-pointer"
            :class="getDayClasses(day)"
            :style="getDayStyles(day)"
            @click="selectDate(day)"
          >
            <span :style="{ fontSize: `${fontSize}px` }">
              {{ day.date }}
            </span>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import type { CalendarWidgetConfig } from './definition'

const props = defineProps<CalendarWidgetConfig>()

// State
const currentDate = ref(new Date())
const selectedDate = ref<Date | null>(null)
const today = new Date()

// Computed
const monthYearDisplay = computed(() => {
  const formatter = new Intl.DateTimeFormat('en-US', { 
    month: 'long', 
    year: 'numeric' 
  })
  return formatter.format(currentDate.value)
})

const daysOfWeek = computed(() => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  if (props.firstDayOfWeek === 'monday') {
    return [...days.slice(1), days[0]]
  }
  return days
})

const calendarWeeks = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  // Calculate start date (beginning of week)
  const startDate = new Date(firstDay)
  const dayOfWeek = firstDay.getDay()
  const daysToSubtract = props.firstDayOfWeek === 'monday' 
    ? (dayOfWeek === 0 ? 6 : dayOfWeek - 1)
    : dayOfWeek
  startDate.setDate(startDate.getDate() - daysToSubtract)
  
  // Build weeks
  const weeks = []
  const currentDateIter = new Date(startDate)
  
  while (currentDateIter <= lastDay || currentDateIter.getDay() !== (props.firstDayOfWeek === 'monday' ? 1 : 0)) {
    const week = {
      weekNumber: getWeekNumber(currentDateIter),
      days: []
    }
    
    for (let i = 0; i < 7; i++) {
      week.days.push({
        date: currentDateIter.getDate(),
        month: currentDateIter.getMonth(),
        year: currentDateIter.getFullYear(),
        isCurrentMonth: currentDateIter.getMonth() === month,
        isToday: isSameDay(currentDateIter, today),
        isSelected: selectedDate.value ? isSameDay(currentDateIter, selectedDate.value) : false,
        isWeekend: currentDateIter.getDay() === 0 || currentDateIter.getDay() === 6
      })
      currentDateIter.setDate(currentDateIter.getDate() + 1)
    }
    
    weeks.push(week)
  }
  
  return weeks
})

// Methods
const previousMonth = () => {
  const newDate = new Date(currentDate.value)
  newDate.setMonth(newDate.getMonth() - 1)
  currentDate.value = newDate
}

const nextMonth = () => {
  const newDate = new Date(currentDate.value)
  newDate.setMonth(newDate.getMonth() + 1)
  currentDate.value = newDate
}

const selectDate = (day: any) => {
  selectedDate.value = new Date(day.year, day.month, day.date)
}

const isWeekend = (dayIndex: number) => {
  if (props.firstDayOfWeek === 'monday') {
    return dayIndex === 5 || dayIndex === 6
  }
  return dayIndex === 0 || dayIndex === 6
}

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

const getDayStyles = (day: any) => {
  const styles: any = {}
  
  if (day.isToday && props.highlightToday && !day.isSelected) {
    // Extract color from Tailwind class if needed
    if (props.todayColor.startsWith('bg-')) {
      // Use the color directly from the class
    }
  }
  
  return styles
}

// Helper functions
const isSameDay = (date1: Date, date2: Date) => {
  return date1.getDate() === date2.getDate() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getFullYear() === date2.getFullYear()
}

const getWeekNumber = (date: Date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}
</script>