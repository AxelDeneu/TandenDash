import { z } from 'zod'
import type { BaseWidgetConfig } from '@/types/widget'
import type { EnhancedWidgetConfig } from '@/types/widget-options'

export interface WidgetConfig extends BaseWidgetConfig {
  // View settings
  defaultView: 'month' | 'week' | 'day' | 'list'
  showWeekNumbers: boolean
  firstDayOfWeek: 'sunday' | 'monday'
  show24Hours: boolean
  
  // Display settings
  highlightToday: boolean
  todayColor: string
  weekendColor: string
  fontSize: number
  compactMode: boolean
  showMonthYear: boolean
  navigationButtons: boolean
  
  // Event settings
  showEvents: boolean
  defaultEventColor: string
  defaultEventDuration: number // minutes
  eventColors: string[]
  eventCategories: string[]
  
  // Sync settings
  syncEnabled: boolean
  syncUrl?: string
  syncInterval: number // minutes
  
  // Appearance
  backgroundColor: string
  textColor: string
  borderColor: string
  headerColor: string
  
  // Permissions
  allowEventCreation: boolean
  allowEventEditing: boolean
  allowEventDeletion: boolean
}

export const widgetDefaults: WidgetConfig = {
  // View settings
  defaultView: 'month',
  showWeekNumbers: false,
  firstDayOfWeek: 'sunday',
  show24Hours: false,
  
  // Display settings
  highlightToday: true,
  todayColor: 'bg-primary',
  weekendColor: 'text-muted-foreground',
  fontSize: 14,
  compactMode: false,
  showMonthYear: true,
  navigationButtons: true,
  
  // Event settings
  showEvents: true,
  defaultEventColor: '#3b82f6',
  defaultEventDuration: 60,
  eventColors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
  eventCategories: ['Personal', 'Work', 'Family', 'Other'],
  
  // Sync settings
  syncEnabled: false,
  syncUrl: '',
  syncInterval: 30,
  
  // Appearance
  backgroundColor: 'bg-background',
  textColor: 'text-foreground',
  borderColor: 'border-border',
  headerColor: 'text-foreground',
  
  // Permissions
  allowEventCreation: true,
  allowEventEditing: true,
  allowEventDeletion: true,
  
  // Base widget config
  minWidth: 400,
  minHeight: 400,
}

export const WidgetConfigSchema = z.object({
  // View settings
  defaultView: z.enum(['month', 'week', 'day', 'list']),
  showWeekNumbers: z.boolean(),
  firstDayOfWeek: z.enum(['sunday', 'monday']),
  show24Hours: z.boolean(),
  
  // Display settings
  highlightToday: z.boolean(),
  todayColor: z.string(),
  weekendColor: z.string(),
  fontSize: z.number().min(10).max(24),
  compactMode: z.boolean(),
  showMonthYear: z.boolean(),
  navigationButtons: z.boolean(),
  
  // Event settings
  showEvents: z.boolean(),
  defaultEventColor: z.string(),
  defaultEventDuration: z.number().min(15).max(480),
  eventColors: z.array(z.string()),
  eventCategories: z.array(z.string()),
  
  // Sync settings
  syncEnabled: z.boolean(),
  syncUrl: z.string().optional(),
  syncInterval: z.number().min(5).max(1440),
  
  // Appearance
  backgroundColor: z.string(),
  textColor: z.string(),
  borderColor: z.string(),
  headerColor: z.string(),
  
  // Permissions
  allowEventCreation: z.boolean(),
  allowEventEditing: z.boolean(),
  allowEventDeletion: z.boolean(),
  
  // Base widget config
  minWidth: z.number().min(300),
  minHeight: z.number().min(300)
})

export const widgetConfig: EnhancedWidgetConfig = {
  groups: [
    {
      id: 'view',
      label: 'View Settings',
      defaultOpen: true,
      options: {
        defaultView: {
          type: 'select',
          label: 'Default View',
          description: 'Choose the default calendar view',
          options: [
            { value: 'month', label: 'Month' },
            { value: 'week', label: 'Week' },
            { value: 'day', label: 'Day' },
            { value: 'list', label: 'List' }
          ]
        },
        firstDayOfWeek: {
          type: 'radio',
          label: 'First Day of Week',
          description: 'Choose which day starts the week',
          options: [
            { value: 'sunday', label: 'Sunday' },
            { value: 'monday', label: 'Monday' }
          ]
        },
        show24Hours: {
          type: 'toggle',
          label: '24-Hour Format',
          description: 'Use 24-hour time format instead of 12-hour'
        },
        showWeekNumbers: {
          type: 'toggle',
          label: 'Show Week Numbers',
          description: 'Display week numbers in month view'
        }
      }
    },
    {
      id: 'display',
      label: 'Display Settings',
      collapsible: true,
      options: {
        showMonthYear: {
          type: 'toggle',
          label: 'Show Month/Year Header',
          description: 'Display the month and year at the top'
        },
        navigationButtons: {
          type: 'toggle',
          label: 'Show Navigation Buttons',
          description: 'Display buttons to navigate between periods'
        },
        compactMode: {
          type: 'toggle',
          label: 'Compact Mode',
          description: 'Show abbreviated day names'
        },
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
      id: 'events',
      label: 'Event Settings',
      collapsible: true,
      options: {
        showEvents: {
          type: 'toggle',
          label: 'Show Events',
          description: 'Display events on the calendar'
        },
        allowEventCreation: {
          type: 'toggle',
          label: 'Allow Event Creation',
          description: 'Allow creating new events',
          dependencies: { showEvents: true }
        },
        allowEventEditing: {
          type: 'toggle',
          label: 'Allow Event Editing',
          description: 'Allow editing existing events',
          dependencies: { showEvents: true }
        },
        allowEventDeletion: {
          type: 'toggle',
          label: 'Allow Event Deletion',
          description: 'Allow deleting events',
          dependencies: { showEvents: true }
        },
        defaultEventDuration: {
          type: 'slider',
          label: 'Default Event Duration',
          description: 'Default duration for new events',
          min: 15,
          max: 480,
          step: 15,
          unit: 'min',
          dependencies: { showEvents: true }
        }
      }
    },
    {
      id: 'sync',
      label: 'Synchronization',
      collapsible: true,
      options: {
        syncEnabled: {
          type: 'toggle',
          label: 'Enable Sync',
          description: 'Enable calendar synchronization'
        },
        syncUrl: {
          type: 'text',
          label: 'iCal URL',
          description: 'URL of the iCal calendar to sync',
          placeholder: 'https://calendar.example.com/feed.ics',
          dependencies: { syncEnabled: true }
        },
        syncInterval: {
          type: 'slider',
          label: 'Sync Interval',
          description: 'How often to sync the calendar',
          min: 5,
          max: 1440,
          step: 5,
          unit: 'min',
          dependencies: { syncEnabled: true }
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