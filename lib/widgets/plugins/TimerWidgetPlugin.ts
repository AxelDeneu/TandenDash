import type { WidgetPluginManifest } from '../interfaces'
import type { TimerWidgetConfig } from '@/components/widgets/Timer/definition'
import { TimerWidgetConfigSchema } from '@/lib/validation'
import TimerComponent from '@/components/widgets/Timer/index.vue'
import { timerWidgetOptions } from '@/components/widgets/Timer/definition'


export const TimerWidgetPlugin: WidgetPluginManifest<TimerWidgetConfig> = {
  metadata: {
    id: 'timer',
    name: 'Timer',
    description: 'A countdown timer with customizable durations and alerts',
    version: '1.0.0',
    author: 'TandenDash',
    category: 'productivity',
    tags: ['timer', 'countdown', 'time', 'productivity', 'pomodoro'],
    icon: '⏲️',
    dependencies: [],
    minDashboardVersion: '1.0.0'
  },
  configSchema: TimerWidgetConfigSchema,
  defaultConfig: timerWidgetOptions,
  component: TimerComponent,
  
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
      console.log('Timer widget mounted:', instance.id)
    },
    onUnmount: async (instance) => {
      console.log('Timer widget unmounted:', instance.id)
    },
    onConfigChange: async (instance, oldConfig, newConfig) => {
      console.log('Timer widget config changed:', instance.id)
    },
    onError: async (instance, error) => {
      console.error('Timer widget error:', instance.id, error)
    }
  }
}