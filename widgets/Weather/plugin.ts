import type { WidgetPlugin as IWidgetPlugin, IDataProvider } from '@/lib/widgets/WidgetCore'
import type { WeatherWidgetConfig } from './definition'
import WeatherComponent from './index.vue'
import { widgetDefaults, WidgetConfigSchema, widgetConfig } from './definition'
import { apiRoutes } from './api'

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
      // Use the new widget API route
      const response = await $fetch('/api/widgets/weather/current', {
        query: { location: this.config.location }
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

export const WIDGET_ID = 'weather'

export const WidgetPlugin: IWidgetPlugin<WeatherWidgetConfig> = {
  id: WIDGET_ID,
  name: 'Weather Widget',
  description: 'Display current weather conditions for any location with customizable display options',
  version: '1.0.0',
  icon: '🌤️',
  category: 'Weather & Environment',
  tags: ['weather', 'temperature', 'conditions', 'location'],
  component: WeatherComponent,
  defaultConfig: widgetDefaults,
  configSchema: WidgetConfigSchema,
  configUI: widgetConfig as any,
  dataProvider: WeatherDataProvider as any,
  permissions: ['network'],
  settings: {
    allowResize: true,
    allowMove: true,
    allowDelete: true,
    allowConfigure: true
  },
  apiRoutes
}