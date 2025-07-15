import type { WidgetPluginManifest, IWidgetDataProvider } from '../interfaces'
import type { WeatherWidgetConfig } from '@/components/widgets/Weather/definition'
import { WeatherWidgetConfigSchema } from '@/lib/validation'
import WeatherComponent from '@/components/widgets/Weather/index.vue'
import { weatherWidgetOptions } from '@/components/widgets/Weather/definition'

// Weather data provider
class WeatherDataProvider implements IWidgetDataProvider<any> {
  private config: WeatherWidgetConfig
  private refreshInterval?: NodeJS.Timeout

  constructor(config: WeatherWidgetConfig) {
    this.config = config
  }

  async fetch(): Promise<any> {
    if (!this.config.location) {
      throw new Error('Location is required for weather data')
    }

    try {
      // Use the secure server-side API endpoint
      const response = await $fetch(`/api/weather/${encodeURIComponent(this.config.location)}`, {
        query: { lang: 'en' }
      })

      return response
    } catch (error) {
      console.error('Failed to fetch weather data:', error)
      throw error
    }
  }

  async refresh(): Promise<any> {
    return this.fetch()
  }

  subscribe(callback: (data: any) => void): () => void {
    // Refresh every 10 minutes
    this.refreshInterval = setInterval(async () => {
      try {
        const data = await this.fetch()
        callback(data)
      } catch (error) {
        console.error('Weather data refresh failed:', error)
      }
    }, 10 * 60 * 1000)

    return () => {
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval)
      }
    }
  }

  validate(data: any): boolean {
    return data && typeof data === 'object' && data.main && data.weather
  }
}

export const WeatherWidgetPlugin: WidgetPluginManifest<WeatherWidgetConfig> = {
  metadata: {
    id: 'weather',
    name: 'Weather Widget',
    description: 'Display current weather conditions for any location with customizable display options',
    version: '1.0.0',
    author: 'TandenDash Team',
    category: 'Weather & Environment',
    tags: ['weather', 'temperature', 'conditions', 'location'],
    icon: '🌤️',
    dependencies: [],
    minDashboardVersion: '1.0.0'
  },
  configSchema: WeatherWidgetConfigSchema,
  defaultConfig: weatherWidgetOptions,
  component: WeatherComponent,
  dataProvider: WeatherDataProvider as any,
  permissions: ['network'],
  settings: {
    allowResize: true,
    allowMove: true,
    allowDelete: true,
    allowConfigure: true
  },
  lifecycle: {
    onMount: async () => {
      // console.log('Weather widget mounted')
    },
    onUnmount: async () => {
      // console.log('Weather widget unmounted')
    },
    onConfigChange: async (newConfig) => {
      // console.log('Weather widget config changed:', newConfig)
    },
    onError: async (error) => {
      console.error('Weather widget error:', error)
    }
  }
}