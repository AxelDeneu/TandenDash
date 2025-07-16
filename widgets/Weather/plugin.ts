import type { WidgetPlugin, IDataProvider } from '@/lib/widgets/WidgetCore'
import type { WeatherWidgetConfig } from './definition'
import WeatherComponent from './index.vue'
import { widgetDefaults, WidgetConfigSchema } from './definition'

// Weather data provider
class WeatherDataProvider implements IDataProvider<any> {
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

  subscribe(callback: (data: any) => void): void {
    // Refresh every 10 minutes
    this.refreshInterval = setInterval(async () => {
      try {
        const data = await this.fetch()
        callback(data)
      } catch (error) {
        console.error('Weather data refresh failed:', error)
      }
    }, 10 * 60 * 1000)
  }

  unsubscribe(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
    }
  }
}

export const WeatherWidgetPlugin: WidgetPlugin<WeatherWidgetConfig> = {
  id: 'weather',
  name: 'Weather Widget',
  description: 'Display current weather conditions for any location with customizable display options',
  version: '1.0.0',
  icon: '🌤️',
  category: 'Weather & Environment',
  tags: ['weather', 'temperature', 'conditions', 'location'],
  component: WeatherComponent,
  defaultConfig: widgetDefaults,
  configSchema: WidgetConfigSchema,
  dataProvider: WeatherDataProvider as any,
  permissions: ['network'],
  settings: {
    allowResize: true,
    allowMove: true,
    allowDelete: true,
    allowConfigure: true
  }
}