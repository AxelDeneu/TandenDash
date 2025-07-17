import type { WidgetPlugin } from '@/lib/widgets/WidgetCore'
import type { TimerWidgetConfig } from './definition'
import TimerComponent from './index.vue'
import { widgetDefaults, WidgetConfigSchema, widgetConfig } from './definition'

export const TimerWidgetPlugin: WidgetPlugin<TimerWidgetConfig> = {
  id: 'timer',
  name: 'Timer',
  description: 'A countdown timer with customizable durations and alerts',
  version: '1.0.0',
  icon: '⏱️',
  category: 'Time & Date',
  tags: ['timer', 'countdown', 'stopwatch', 'time'],
  component: TimerComponent,
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