import type { WidgetPlugin } from '@/lib/widgets/WidgetCore'
import type { WidgetConfig } from './definition'
import { WidgetConfigSchema, widgetDefaults, widgetConfig } from './definition'
import TaskCounterComponent from './index.vue'

export const TaskCounterWidgetPlugin: WidgetPlugin<WidgetConfig> = {
  id: 'task-counter',
  name: 'Task Counter',
  description: 'A widget to track and display task completion progress',
  version: '1.0.0',
  icon: '✅',
  category: 'productivity',
  tags: ['tasks', 'progress', 'productivity'],
  component: TaskCounterComponent,
  defaultConfig: widgetDefaults,
  configSchema: WidgetConfigSchema,
  configUI: widgetConfig as any,
  settings: {
    allowResize: true,
    allowMove: true,
    allowDelete: true,
    allowConfigure: true
  },
  permissions: []
}