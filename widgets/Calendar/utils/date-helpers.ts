import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
  isSameMonth,
  isWeekend,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  getWeek,
  parseISO,
  formatISO,
  startOfDay,
  endOfDay,
  isWithinInterval
} from 'date-fns'

export function getCalendarMonth(date: Date, weekStartsOn: 0 | 1 = 0) {
  const start = startOfMonth(date)
  const end = endOfMonth(date)
  
  // Get the start of the week for the first day of the month
  const calendarStart = startOfWeek(start, { weekStartsOn })
  // Get the end of the week for the last day of the month
  const calendarEnd = endOfWeek(end, { weekStartsOn })
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  
  return days.map(day => ({
    date: day.getDate(),
    month: day.getMonth(),
    year: day.getFullYear(),
    isCurrentMonth: isSameMonth(day, date),
    isToday: isSameDay(day, new Date()),
    isWeekend: isWeekend(day),
    fullDate: day
  }))
}

export function getCalendarWeek(date: Date, weekStartsOn: 0 | 1 = 0) {
  const start = startOfWeek(date, { weekStartsOn })
  const end = endOfWeek(date, { weekStartsOn })
  
  const days = eachDayOfInterval({ start, end })
  
  return days.map(day => ({
    date: day.getDate(),
    month: day.getMonth(),
    year: day.getFullYear(),
    isCurrentMonth: true,
    isToday: isSameDay(day, new Date()),
    isWeekend: isWeekend(day),
    fullDate: day
  }))
}

export function getWeekNumber(date: Date, weekStartsOn: 0 | 1 = 0): number {
  return getWeek(date, { weekStartsOn })
}

export function formatMonthYear(date: Date, locale = 'en-US'): string {
  return format(date, 'MMMM yyyy')
}

export function formatDate(date: Date | string, formatStr = 'PPP'): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, formatStr)
}

export function formatTime(date: Date | string, use24Hour = false): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, use24Hour ? 'HH:mm' : 'h:mm a')
}

export function formatDateTime(date: Date | string, use24Hour = false): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, use24Hour ? 'PPP HH:mm' : 'PPP h:mm a')
}

export function getDaysOfWeek(weekStartsOn: 0 | 1 = 0, locale = 'en-US'): string[] {
  const baseDate = new Date(2024, 0, weekStartsOn === 0 ? 7 : 1) // A Sunday or Monday
  const days = []
  
  for (let i = 0; i < 7; i++) {
    const day = addDays(baseDate, i)
    days.push(format(day, 'EEEE'))
  }
  
  return days
}

export function getShortDaysOfWeek(weekStartsOn: 0 | 1 = 0): string[] {
  const days = getDaysOfWeek(weekStartsOn)
  return days.map(day => day.slice(0, 3))
}

export function navigateMonth(current: Date, direction: 'prev' | 'next'): Date {
  return direction === 'next' ? addMonths(current, 1) : subMonths(current, 1)
}

export function navigateWeek(current: Date, direction: 'prev' | 'next'): Date {
  return direction === 'next' ? addWeeks(current, 1) : subWeeks(current, 1)
}

export function navigateDay(current: Date, direction: 'prev' | 'next'): Date {
  return direction === 'next' ? addDays(current, 1) : subDays(current, 1)
}

export function isEventInDay(event: { startDate: string; endDate: string }, day: Date): boolean {
  const dayStart = startOfDay(day)
  const dayEnd = endOfDay(day)
  const eventStart = parseISO(event.startDate)
  const eventEnd = parseISO(event.endDate)
  
  return isWithinInterval(dayStart, { start: eventStart, end: eventEnd }) ||
         isWithinInterval(eventStart, { start: dayStart, end: dayEnd }) ||
         isSameDay(eventStart, day) ||
         isSameDay(eventEnd, day)
}

export function getEventsForDay(
  events: Array<{ startDate: string; endDate: string }>, 
  day: Date
): Array<{ startDate: string; endDate: string }> {
  return events.filter(event => isEventInDay(event, day))
}

export function groupEventsByDay(
  events: Array<{ startDate: string; endDate: string }>,
  startDate: Date,
  endDate: Date
): Map<string, Array<{ startDate: string; endDate: string }>> {
  const grouped = new Map<string, Array<{ startDate: string; endDate: string }>>()
  const days = eachDayOfInterval({ start: startDate, end: endDate })
  
  days.forEach(day => {
    const dayKey = format(day, 'yyyy-MM-dd')
    const dayEvents = getEventsForDay(events, day)
    if (dayEvents.length > 0) {
      grouped.set(dayKey, dayEvents)
    }
  })
  
  return grouped
}

export function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
  
  return format(date, 'MMM d, yyyy')
}

export { formatISO }