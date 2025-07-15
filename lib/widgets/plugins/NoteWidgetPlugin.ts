import type { WidgetPluginManifest } from '../interfaces'
import type { NoteWidgetConfig } from '@/components/widgets/Note/definition'
import { NoteWidgetConfigSchema } from '@/lib/validation'
import NoteComponent from '@/components/widgets/Note/index.vue'
import { noteWidgetOptions } from '@/components/widgets/Note/definition'


export const NoteWidgetPlugin: WidgetPluginManifest<NoteWidgetConfig> = {
  metadata: {
    id: 'note',
    name: 'Note',
    description: 'A simple text note widget with customizable styling',
    version: '1.0.0',
    author: 'TandenDash',
    category: 'productivity',
    tags: ['note', 'text', 'memo', 'sticky', 'markdown'],
    icon: '📝',
    dependencies: [],
    minDashboardVersion: '1.0.0'
  },
  configSchema: NoteWidgetConfigSchema,
  defaultConfig: noteWidgetOptions,
  component: NoteComponent,
  
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
      console.log('Note widget mounted:', instance.id)
    },
    onUnmount: async (instance) => {
      console.log('Note widget unmounted:', instance.id)
    },
    onConfigChange: async (instance, oldConfig, newConfig) => {
      console.log('Note widget config changed:', instance.id)
    },
    onError: async (instance, error) => {
      console.error('Note widget error:', instance.id, error)
    }
  }
}