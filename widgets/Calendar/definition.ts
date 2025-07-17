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

export const widgetDefaults: WidgetConfig = {
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
  minWidth: z.number().min(200),
  minHeight: z.number().min(200)
})

export const widgetConfig: EnhancedWidgetConfig = {
  groups: [
    {
      id: 'display',
      label: 'Display Settings',
      defaultOpen: true,
      options: {
        showMonthYear: {
          type: 'toggle',
          label: 'Show Month/Year Header',
          description: 'Display the month and year at the top of the calendar'
        },
        navigationButtons: {
          type: 'toggle',
          label: 'Show Navigation Buttons',
          description: 'Display buttons to navigate between months'
        },
        showWeekNumbers: {
          type: 'toggle',
          label: 'Show Week Numbers',
          description: 'Display week numbers on the left side'
        },
        compactMode: {
          type: 'toggle',
          label: 'Compact Mode',
          description: 'Show abbreviated day names'
        },
        firstDayOfWeek: {
          type: 'radio',
          label: 'First Day of Week',
          description: 'Choose which day starts the week',
          options: [
            { value: 'sunday', label: 'Sunday' },
            { value: 'monday', label: 'Monday' }
          ]
        }
      }
    },
    {
      id: 'styling',
      label: 'Styling',
      collapsible: true,
      options: {
        fontSize: {
          type: 'slider',
          label: 'Font Size',
          description: 'Size of the calendar text',
          min: 10,
          max: 24,
          step: 1,
          unit: 'px'
        },
        highlightToday: {
          type: 'toggle',
          label: 'Highlight Today',
          description: 'Highlight the current date'
        },
        todayColor: {
          type: 'select',
          label: 'Today Highlight Color',
          description: 'Color for highlighting today\'s date',
          options: [
            { value: 'bg-primary', label: 'Primary' },
            { value: 'bg-blue-500', label: 'Blue' },
            { value: 'bg-green-500', label: 'Green' },
            { value: 'bg-yellow-500', label: 'Yellow' },
            { value: 'bg-red-500', label: 'Red' }
          ],
          dependencies: { highlightToday: true }
        },
        weekendColor: {
          type: 'select',
          label: 'Weekend Text Color',
          description: 'Color for weekend days',
          options: [
            { value: 'text-muted-foreground', label: 'Muted' },
            { value: 'text-gray-500', label: 'Gray' },
            { value: 'text-blue-500', label: 'Blue' },
            { value: 'text-red-500', label: 'Red' }
          ]
        }
      }
    },
    {
      id: 'appearance',
      label: 'Appearance',
      collapsible: true,
      options: {
        backgroundColor: {
          type: 'select',
          label: 'Background Color',
          description: 'Calendar background color',
          options: [
            { value: 'bg-background', label: 'Default' },
            { value: 'bg-white', label: 'White' },
            { value: 'bg-gray-50', label: 'Light Gray' },
            { value: 'bg-gray-100', label: 'Gray' }
          ]
        },
        textColor: {
          type: 'select',
          label: 'Text Color',
          description: 'Main text color',
          options: [
            { value: 'text-foreground', label: 'Default' },
            { value: 'text-black', label: 'Black' },
            { value: 'text-gray-800', label: 'Dark Gray' },
            { value: 'text-gray-600', label: 'Gray' }
          ]
        },
        borderColor: {
          type: 'select',
          label: 'Border Color',
          description: 'Calendar border color',
          options: [
            { value: 'border-border', label: 'Default' },
            { value: 'border-gray-200', label: 'Light Gray' },
            { value: 'border-gray-300', label: 'Gray' },
            { value: 'border-gray-400', label: 'Dark Gray' }
          ]
        },
        headerColor: {
          type: 'select',
          label: 'Header Text Color',
          description: 'Month/Year header text color',
          options: [
            { value: 'text-foreground', label: 'Default' },
            { value: 'text-black', label: 'Black' },
            { value: 'text-gray-800', label: 'Dark Gray' },
            { value: 'text-primary', label: 'Primary' }
          ]
        }
      }
    }
  ]
}