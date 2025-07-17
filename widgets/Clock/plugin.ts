import type { WidgetPlugin } from '@/lib/widgets/WidgetCore'
import type { ClockWidgetConfig } from './definition'
import ClockComponent from './index.vue'
import { widgetDefaults, WidgetConfigSchema, widgetConfig } from './definition'

export const ClockWidgetPlugin: WidgetPlugin<ClockWidgetConfig> = {
  id: 'clock',
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