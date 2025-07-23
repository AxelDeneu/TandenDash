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
  syncType: 'readonly' | 'bidirectional'
  syncUrl?: string
  syncInterval: number // minutes
  
  // CalDAV settings (for bidirectional sync)
  caldavUsername?: string
  caldavPassword?: string // Will be encrypted
  caldavCalendarUrl?: string
  
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
  syncType: 'readonly',
  syncUrl: '',
  syncInterval: 30,
  
  // CalDAV settings
  caldavUsername: '',
  caldavPassword: '',
  caldavCalendarUrl: '',
  
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
  syncType: z.enum(['readonly', 'bidirectional']),
  syncUrl: z.string().optional(),
  syncInterval: z.number().min(5).max(1440),
  
  // CalDAV settings
  caldavUsername: z.string().optional(),
  caldavPassword: z.string().optional(),
  caldavCalendarUrl: z.string().optional(),
  
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
      label: '@config.groups.view.label',
      description: '@config.groups.view.description',
      defaultOpen: true,
      options: {
        defaultView: {
          type: 'select',
          label: '@options.defaultView',
          description: '@options.defaultViewDesc',
          options: [
            { value: 'month', label: '@views.month' },
            { value: 'week', label: '@views.week' },
            { value: 'day', label: '@views.day' },
            { value: 'list', label: '@views.list' }
          ]
        },
        firstDayOfWeek: {
          type: 'radio',
          label: '@options.firstDayOfWeek',
          description: '@options.firstDayOfWeekDesc',
          options: [
            { value: 'sunday', label: '@weekDays.sunday' },
            { value: 'monday', label: '@weekDays.monday' }
          ]
        },
        show24Hours: {
          type: 'toggle',
          label: '@options.24HourFormat',
          description: '@options.24HourFormatDesc'
        },
        showWeekNumbers: {
          type: 'toggle',
          label: '@options.showWeekNumbers',
          description: '@options.showWeekNumbersDesc'
        }
      }
    },
    {
      id: 'display',
      label: '@config.groups.display.label',
      description: '@config.groups.display.description',
      collapsible: true,
      options: {
        showMonthYear: {
          type: 'toggle',
          label: '@options.showMonthYear',
          description: '@options.showMonthYearDesc'
        },
        navigationButtons: {
          type: 'toggle',
          label: '@options.showNavButtons',
          description: '@options.showNavButtonsDesc'
        },
        compactMode: {
          type: 'toggle',
          label: '@options.compactMode',
          description: '@options.compactModeDesc'
        },
        fontSize: {
          type: 'slider',
          label: '@options.fontSize',
          description: '@options.fontSizeDesc',
          min: 10,
          max: 24,
          step: 1,
          unit: 'px'
        },
        highlightToday: {
          type: 'toggle',
          label: '@options.highlightToday',
          description: '@options.highlightTodayDesc'
        },
        todayColor: {
          type: 'select',
          label: '@options.todayColor',
          description: '@options.todayColorDesc',
          options: [
            { value: 'bg-primary', label: '@colors.primary' },
            { value: 'bg-blue-500', label: '@colors.blue' },
            { value: 'bg-green-500', label: '@colors.green' },
            { value: 'bg-yellow-500', label: '@colors.yellow' },
            { value: 'bg-red-500', label: '@colors.red' }
          ],
          dependencies: { highlightToday: true }
        },
        weekendColor: {
          type: 'select',
          label: '@options.weekendColor',
          description: '@options.weekendColorDesc',
          options: [
            { value: 'text-muted-foreground', label: '@colors.muted' },
            { value: 'text-gray-500', label: '@colors.gray' },
            { value: 'text-blue-500', label: '@colors.blue' },
            { value: 'text-red-500', label: '@colors.red' }
          ]
        }
      }
    },
    {
      id: 'events',
      label: '@config.groups.events.label',
      description: '@config.groups.events.description',
      collapsible: true,
      options: {
        showEvents: {
          type: 'toggle',
          label: '@options.showEvents',
          description: '@options.showEventsDesc'
        },
        allowEventCreation: {
          type: 'toggle',
          label: '@options.allowEventCreation',
          description: '@options.allowEventCreationDesc',
          dependencies: { showEvents: true }
        },
        allowEventEditing: {
          type: 'toggle',
          label: '@options.allowEventEditing',
          description: '@options.allowEventEditingDesc',
          dependencies: { showEvents: true }
        },
        allowEventDeletion: {
          type: 'toggle',
          label: '@options.allowEventDeletion',
          description: '@options.allowEventDeletionDesc',
          dependencies: { showEvents: true }
        },
        defaultEventDuration: {
          type: 'slider',
          label: '@options.defaultEventDuration',
          description: '@options.defaultEventDurationDesc',
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
      label: '@config.groups.sync.label',
      description: '@config.groups.sync.description',
      collapsible: true,
      options: {
        syncEnabled: {
          type: 'toggle',
          label: '@options.enableSync',
          description: '@options.enableSyncDesc'
        },
        syncType: {
          type: 'radio',
          label: '@options.syncType',
          description: '@options.syncTypeDesc',
          options: [
            { value: 'readonly', label: '@options.readonlySync' },
            { value: 'bidirectional', label: '@options.bidirectionalSync' }
          ],
          dependencies: { syncEnabled: true }
        },
        syncUrl: {
          type: 'text',
          label: '@options.syncUrl',
          description: '@options.syncUrlDesc',
          placeholder: '@placeholders.icalUrl',
          dependencies: { syncEnabled: true, syncType: 'readonly' }
        },
        caldavCalendarUrl: {
          type: 'text',
          label: '@options.caldavUrl',
          description: '@options.caldavUrlDesc',
          placeholder: '@placeholders.caldavUrl',
          dependencies: { syncEnabled: true, syncType: 'bidirectional' }
        },
        caldavUsername: {
          type: 'text',
          label: '@options.caldavUsername',
          description: '@options.caldavUsernameDesc',
          dependencies: { syncEnabled: true, syncType: 'bidirectional' }
        },
        caldavPassword: {
          type: 'text',
          label: '@options.caldavPassword',
          description: '@options.caldavPasswordDesc',
          dependencies: { syncEnabled: true, syncType: 'bidirectional' }
        },
        syncInterval: {
          type: 'slider',
          label: '@options.syncInterval',
          description: '@options.syncIntervalDesc',
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
      label: '@config.groups.appearance.label',
      description: '@config.groups.appearance.description',
      collapsible: true,
      options: {
        backgroundColor: {
          type: 'select',
          label: '@options.backgroundColor',
          description: '@options.backgroundColorDesc',
          options: [
            { value: 'bg-background', label: '@colors.default' },
            { value: 'bg-white', label: '@colors.white' },
            { value: 'bg-gray-50', label: '@colors.lightGray' },
            { value: 'bg-gray-100', label: '@colors.gray' }
          ]
        },
        textColor: {
          type: 'select',
          label: '@options.textColor',
          description: '@options.textColorDesc',
          options: [
            { value: 'text-foreground', label: '@colors.default' },
            { value: 'text-black', label: '@colors.black' },
            { value: 'text-gray-800', label: '@colors.darkGray' },
            { value: 'text-gray-600', label: '@colors.gray' }
          ]
        },
        borderColor: {
          type: 'select',
          label: '@options.borderColor',
          description: '@options.borderColorDesc',
          options: [
            { value: 'border-border', label: '@colors.default' },
            { value: 'border-gray-200', label: '@colors.lightGray' },
            { value: 'border-gray-300', label: '@colors.gray' },
            { value: 'border-gray-400', label: '@colors.darkGray' }
          ]
        },
        headerColor: {
          type: 'select',
          label: '@options.headerColor',
          description: '@options.headerColorDesc',
          options: [
            { value: 'text-foreground', label: '@colors.default' },
            { value: 'text-black', label: '@colors.black' },
            { value: 'text-gray-800', label: '@colors.darkGray' },
            { value: 'text-primary', label: '@colors.primary' }
          ]
        }
      }
    }
  ]
}