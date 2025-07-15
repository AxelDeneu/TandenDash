import type { BaseWidgetConfig } from '@/types/widget'

export interface CalendarWidgetConfig extends BaseWidgetConfig {
  showWeekNumbers: boolean
  firstDayOfWeek: 'sunday' | 'monday'
  highlightToday: boolean
  todayColor: string
  weekendColor: string
  fontSize: number
  compactMode: boolean
  showMonthYear: boolean
  navigationButtons: boolean
  backgroundColor: string
  textColor: string
  borderColor: string
  headerColor: string
}

export const calendarWidgetOptions: Required<Omit<CalendarWidgetConfig, keyof BaseWidgetConfig>> = {
  showWeekNumbers: false,
  firstDayOfWeek: 'sunday',
  highlightToday: true,
  todayColor: 'bg-primary',
  weekendColor: 'text-muted-foreground',
  fontSize: 14,
  compactMode: false,
  showMonthYear: true,
  navigationButtons: true,
  backgroundColor: 'bg-background',
  textColor: 'text-foreground',
  borderColor: 'border-border',
  headerColor: 'text-foreground',
  minWidth: 300,
  minHeight: 320,
};