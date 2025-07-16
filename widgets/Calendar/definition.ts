import { z } from 'zod'
import type { BaseWidgetConfig } from '@/types/widget'
import type { EnhancedWidgetConfig } from '@/types/widget-options'

export interface WidgetConfig extends BaseWidgetConfig {
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

export const widgetDefaults: Required<Omit<WidgetConfig, keyof BaseWidgetConfig>> = {
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
}

export const WidgetConfigSchema = z.object({
  showWeekNumbers: z.boolean(),
  firstDayOfWeek: z.enum(['sunday', 'monday']),
  highlightToday: z.boolean(),
  todayColor: z.string(),
  weekendColor: z.string(),
  fontSize: z.number().min(10).max(24),
  compactMode: z.boolean(),
  showMonthYear: z.boolean(),
  navigationButtons: z.boolean(),
  backgroundColor: z.string(),
  textColor: z.string(),
  borderColor: z.string(),
  headerColor: z.string(),
  minWidth: z.number().min(1),
  minHeight: z.number().min(1)
})

export const widgetConfig: EnhancedWidgetConfig = {
  name: 'Calendar',
  description: 'A touch-friendly calendar widget for viewing dates and months',
  groups: [
    {
      id: 'display',
      label: 'Display Settings',
      options: [
        {
          id: 'showMonthYear',
          type: 'toggle',
          label: 'Show Month/Year Header',
          defaultValue: true
        },
        {
          id: 'navigationButtons',
          type: 'toggle',
          label: 'Show Navigation Buttons',
          defaultValue: true
        },
        {
          id: 'showWeekNumbers',
          type: 'toggle',
          label: 'Show Week Numbers',
          defaultValue: false
        },
        {
          id: 'compactMode',
          type: 'toggle',
          label: 'Compact Mode',
          defaultValue: false,
          description: 'Show abbreviated day names'
        },
        {
          id: 'firstDayOfWeek',
          type: 'radio',
          label: 'First Day of Week',
          defaultValue: 'sunday',
          options: [
            { value: 'sunday', label: 'Sunday' },
            { value: 'monday', label: 'Monday' }
          ]
        }
      ]
    },
    {
      id: 'styling',
      label: 'Styling',
      options: [
        {
          id: 'fontSize',
          type: 'slider',
          label: 'Font Size',
          defaultValue: 14,
          min: 10,
          max: 24,
          unit: 'px'
        },
        {
          id: 'highlightToday',
          type: 'toggle',
          label: 'Highlight Today',
          defaultValue: true
        },
        {
          id: 'todayColor',
          type: 'select',
          label: 'Today Highlight Color',
          defaultValue: 'bg-primary',
          options: [
            { value: 'bg-primary', label: 'Primary' },
            { value: 'bg-blue-500', label: 'Blue' },
            { value: 'bg-green-500', label: 'Green' },
            { value: 'bg-yellow-500', label: 'Yellow' },
            { value: 'bg-red-500', label: 'Red' }
          ],
          showIf: { highlightToday: true }
        },
        {
          id: 'weekendColor',
          type: 'select',
          label: 'Weekend Text Color',
          defaultValue: 'text-muted-foreground',
          options: [
            { value: 'text-muted-foreground', label: 'Muted' },
            { value: 'text-gray-500', label: 'Gray' },
            { value: 'text-blue-500', label: 'Blue' },
            { value: 'text-red-500', label: 'Red' }
          ]
        }
      ]
    },
    {
      id: 'appearance',
      label: 'Appearance',
      options: [
        {
          id: 'backgroundColor',
          type: 'select',
          label: 'Background Color',
          defaultValue: 'bg-background',
          options: [
            { value: 'bg-background', label: 'Default' },
            { value: 'bg-white dark:bg-gray-900', label: 'White/Dark' },
            { value: 'bg-gray-50 dark:bg-gray-800', label: 'Light Gray' },
            { value: 'bg-blue-50 dark:bg-blue-900/20', label: 'Light Blue' }
          ]
        },
        {
          id: 'textColor',
          type: 'select',
          label: 'Text Color',
          defaultValue: 'text-foreground',
          options: [
            { value: 'text-foreground', label: 'Default' },
            { value: 'text-gray-900 dark:text-gray-100', label: 'High Contrast' },
            { value: 'text-gray-700 dark:text-gray-300', label: 'Medium Contrast' }
          ]
        },
        {
          id: 'borderColor',
          type: 'select',
          label: 'Border Color',
          defaultValue: 'border-border',
          options: [
            { value: 'border-border', label: 'Default' },
            { value: 'border-gray-200 dark:border-gray-700', label: 'Gray' },
            { value: 'border-transparent', label: 'None' }
          ]
        },
        {
          id: 'headerColor',
          type: 'select',
          label: 'Header Text Color',
          defaultValue: 'text-foreground',
          options: [
            { value: 'text-foreground', label: 'Default' },
            { value: 'text-primary', label: 'Primary' },
            { value: 'text-gray-900 dark:text-gray-100', label: 'High Contrast' }
          ]
        }
      ]
    }
  ]
}