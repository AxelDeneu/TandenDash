import type { WidgetPlugin } from '@/lib/widgets/WidgetCore'
import type { ClockWidgetConfig } from './definition'
import ClockComponent from './index.vue'
import { widgetDefaults, WidgetConfigSchema, widgetConfig } from './definition'

export const CLOCK_WIDGET_ID = 'clock'

export const ClockWidgetPlugin: WidgetPlugin<ClockWidgetConfig> = {
  id: CLOCK_WIDGET_ID,
  name: 'Digital Clock',
  description: 'A customizable digital clock widget with multiple display formats and animations',
  version: '1.0.0',
  icon: '🕐',
  category: 'Time & Date',
  tags: ['clock', 'time', 'digital', 'datetime'],
  component: ClockComponent,
  defaultConfig: widgetDefaults,
  configSchema: WidgetConfigSchema,
  configUI: widgetConfig as any,
  settings: {
    allowResize: true,
    allowMove: true,
    allowDelete: true,
    allowConfigure: true
  }
}