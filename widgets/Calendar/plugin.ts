import type { WidgetPlugin } from '@/lib/widgets/WidgetCore'
import type { WidgetConfig } from './definition'
import { WidgetConfigSchema, widgetDefaults } from './definition'
import CalendarComponent from './index.vue'

export const CalendarWidgetPlugin: WidgetPlugin<WidgetConfig> = {
  id: 'calendar',
  name: 'Calendar',
  description: 'A touch-friendly calendar widget for viewing dates and months',
  version: '1.0.0',
  icon: '📅',
  category: 'productivity',
  tags: ['calendar', 'date', 'time', 'schedule'],
  component: CalendarComponent,
  defaultConfig: widgetDefaults,
  configSchema: WidgetConfigSchema,
  settings: {
    allowResize: true,
    allowMove: true,
    allowDelete: true,
    allowConfigure: true
  },
  permissions: []
}