import type { BaseWidgetConfig } from '@/types/widget'

export interface WeatherWidgetConfig extends BaseWidgetConfig {
  showTemperature: boolean
  showCondition: boolean
  showIcon: boolean
  showLocation: boolean
  temperatureSize: string | number
  locationSize: string | number
  conditionSize: string | number
  iconSize: string
  location: string
}

export const weatherWidgetOptions: Required<WeatherWidgetConfig> = {
  showTemperature: true,
  showCondition: true,
  showIcon: true,
  showLocation: true,
  temperatureSize: 36,
  locationSize: 20,
  conditionSize: 18,
  iconSize: 'w-12 h-12',
  minWidth: 300,
  minHeight: 200,
  location: 'Paris',
}; 