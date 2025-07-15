import type { WidgetPluginManifest } from '../interfaces'
import type { CalendarWidgetConfig } from '@/components/widgets/Calendar/definition'
import { CalendarWidgetConfigSchema } from '@/lib/validation'
import CalendarComponent from '@/components/widgets/Calendar/index.vue'
import { calendarWidgetOptions } from '@/components/widgets/Calendar/definition'


export const CalendarWidgetPlugin: WidgetPluginManifest<CalendarWidgetConfig> = {
  metadata: {
    id: 'calendar',
    name: 'Calendar',
    description: 'A touch-friendly calendar widget for viewing dates and months',
    version: '1.0.0',
    author: 'TandenDash',
    category: 'productivity',
    tags: ['calendar', 'date', 'time', 'schedule'],
    icon: '📅',
    dependencies: [],
    minDashboardVersion: '1.0.0'
  },
  configSchema: CalendarWidgetConfigSchema,
  defaultConfig: calendarWidgetOptions,
  component: CalendarComponent,
  
  settings: {
    allowResize: true,
    allowMove: true,
    allowDelete: true,
    allowConfigure: true,
    refreshInterval: undefined
  },
  
  permissions: [],
  
  lifecycle: {
    onMount: async (instance) => {
      console.log('Calendar widget mounted:', instance.id)
    },
    onUnmount: async (instance) => {
      console.log('Calendar widget unmounted:', instance.id)
    },
    onConfigChange: async (instance, oldConfig, newConfig) => {
      console.log('Calendar widget config changed:', instance.id)
    },
    onError: async (instance, error) => {
      console.error('Calendar widget error:', instance.id, error)
    }
  }
}