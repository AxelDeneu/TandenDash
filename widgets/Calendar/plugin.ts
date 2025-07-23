import type { WidgetPlugin as IWidgetPlugin } from '@/lib/widgets/WidgetCore'
import type { WidgetConfig } from './definition'
import { WidgetConfigSchema, widgetDefaults, widgetConfig } from './definition'
import CalendarComponent from './index.vue'
import { apiRoutes } from './api'

export const WIDGET_ID = 'calendar'

export const WidgetPlugin: IWidgetPlugin<WidgetConfig> = {
  id: WIDGET_ID,
  name: 'Calendar',
  description: 'A touch-friendly calendar widget for viewing dates and months',
  version: '1.0.0',
  icon: '📅',
  category: 'productivity',
  tags: ['calendar', 'date', 'time', 'schedule'],
  component: CalendarComponent,
  defaultConfig: widgetDefaults,
  configSchema: WidgetConfigSchema,
  configUI: widgetConfig as any,
  settings: {
    allowResize: true,
    allowMove: true,
    allowDelete: true,
    allowConfigure: true
  },
  permissions: ['network'],
  apiRoutes
}