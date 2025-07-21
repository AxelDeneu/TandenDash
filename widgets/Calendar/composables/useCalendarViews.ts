import { ref, computed, type Ref } from 'vue'
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek,
  startOfDay,
  endOfDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays
} from 'date-fns'
import type { CalendarView } from '../types'

export function useCalendarViews(initialView: CalendarView['type'] = 'month', weekStartsOn: 0 | 1 = 0) {
  // Current view type
  const viewType = ref<CalendarView['type']>(initialView)
  
  // Current date (center of the view)
  const currentDate = ref(new Date())
  
  // Selected date (for user selection)
  const selectedDate = ref<Date | null>(null)
  
  // Compute view boundaries based on view type
  const viewBounds = computed(() => {
    const date = currentDate.value
    
    switch (viewType.value) {
      case 'month': {
        const monthStart = startOfMonth(date)
        const monthEnd = endOfMonth(date)
        // Include full weeks at start and end
        const start = startOfWeek(monthStart, { weekStartsOn })
        const end = endOfWeek(monthEnd, { weekStartsOn })
        return { start, end }
      }
      
      case 'week': {
        const start = startOfWeek(date, { weekStartsOn })
        const end = endOfWeek(date, { weekStartsOn })
        return { start, end }
      }
      
      case 'day': {
        const start = startOfDay(date)
        const end = endOfDay(date)
        return { start, end }
      }
      
      case 'list': {
        // List view shows from today forward
        const start = startOfDay(new Date())
        const end = addDays(start, 30) // Show 30 days ahead
        return { start, end }
      }
      
      default:
        return { start: date, end: date }
    }
  })
  
  // Current view object
  const currentView = computed<CalendarView>(() => ({
    type: viewType.value,
    currentDate: currentDate.value,
    startDate: viewBounds.value.start,
    endDate: viewBounds.value.end
  }))
  
  // Navigation functions
  function navigatePrevious() {
    switch (viewType.value) {
      case 'month':
        currentDate.value = subMonths(currentDate.value, 1)
        break
      case 'week':
        currentDate.value = subWeeks(currentDate.value, 1)
        break
      case 'day':
        currentDate.value = subDays(currentDate.value, 1)
        break
      case 'list':
        // List view doesn't navigate
        break
    }
  }
  
  function navigateNext() {
    switch (viewType.value) {
      case 'month':
        currentDate.value = addMonths(currentDate.value, 1)
        break
      case 'week':
        currentDate.value = addWeeks(currentDate.value, 1)
        break
      case 'day':
        currentDate.value = addDays(currentDate.value, 1)
        break
      case 'list':
        // List view doesn't navigate
        break
    }
  }
  
  function navigateToToday() {
    currentDate.value = new Date()
  }
  
  function navigateToDate(date: Date) {
    currentDate.value = date
  }
  
  // View switching
  function switchView(view: CalendarView['type']) {
    viewType.value = view
    
    // When switching to day view, navigate to selected date if available
    if (view === 'day' && selectedDate.value) {
      currentDate.value = selectedDate.value
    }
  }
  
  // Date selection
  function selectDate(date: Date | null) {
    selectedDate.value = date
  }
  
  // Check if a date is in the current view
  function isDateInView(date: Date): boolean {
    return date >= viewBounds.value.start && date <= viewBounds.value.end
  }
  
  // View title for display
  const viewTitle = computed(() => {
    const date = currentDate.value
    
    switch (viewType.value) {
      case 'month':
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      
      case 'week': {
        const start = viewBounds.value.start
        const end = viewBounds.value.end
        const startMonth = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        const endMonth = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        return `${startMonth} - ${endMonth}`
      }
      
      case 'day':
        return date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        })
      
      case 'list':
        return 'Upcoming Events'
      
      default:
        return ''
    }
  })
  
  // Check if navigation is possible
  const canNavigate = computed(() => viewType.value !== 'list')
  
  return {
    // State
    viewType: readonly(viewType),
    currentDate: readonly(currentDate),
    selectedDate: readonly(selectedDate),
    currentView: readonly(currentView),
    viewBounds: readonly(viewBounds),
    viewTitle: readonly(viewTitle),
    canNavigate: readonly(canNavigate),
    
    // Methods
    navigatePrevious,
    navigateNext,
    navigateToToday,
    navigateToDate,
    switchView,
    selectDate,
    isDateInView
  }
}