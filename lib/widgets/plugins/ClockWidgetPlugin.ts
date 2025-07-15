import type { WidgetPluginManifest } from '../interfaces'
import type { ClockWidgetConfig } from '@/components/widgets/Clock/definition'
import { ClockWidgetConfigSchema } from '@/lib/validation'
import ClockComponent from '@/components/widgets/Clock/index.vue'
import { clockWidgetOptions } from '@/components/widgets/Clock/definition'

export const ClockWidgetPlugin: WidgetPluginManifest<ClockWidgetConfig> = {
  metadata: {
    id: 'clock',
    name: 'Digital Clock',
    description: 'A customizable digital clock widget with multiple display formats and animations',
    version: '1.0.0',
    author: 'TandenDash Team',
    category: 'Time & Date',
    tags: ['clock', 'time', 'digital', 'datetime'],
    icon: '🕐',
    dependencies: [],
    minDashboardVersion: '1.0.0'
  },
  configSchema: ClockWidgetConfigSchema,
  defaultConfig: clockWidgetOptions,
  component: ClockComponent,
  settings: {
    allowResize: true,
    allowMove: true,
    allowDelete: true,
    allowConfigure: true
  },
  lifecycle: {
    onMount: async () => {
      // console.log('Clock widget mounted')
    },
    onUnmount: async () => {
      // console.log('Clock widget unmounted')
    },
    onConfigChange: async (newConfig) => {
      // console.log('Clock widget config changed:', newConfig)
    },
    onResize: async (width, height) => {
      // console.log('Clock widget resized:', { width, height })
    }
  }
}