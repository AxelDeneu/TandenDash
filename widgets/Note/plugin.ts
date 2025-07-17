import type { WidgetPlugin } from '@/lib/widgets/WidgetCore'
import type { NoteWidgetConfig } from './definition'
import NoteComponent from './index.vue'
import { widgetDefaults, WidgetConfigSchema, widgetConfig } from './definition'

export const NoteWidgetPlugin: WidgetPlugin<NoteWidgetConfig> = {
  id: 'note',
  name: 'Note',
  description: 'A simple text note widget with customizable styling',
  version: '1.0.0',
  icon: '📝',
  category: 'Productivity',
  tags: ['note', 'text', 'markdown', 'sticky'],
  component: NoteComponent,
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