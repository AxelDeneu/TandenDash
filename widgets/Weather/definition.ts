import type { BaseWidgetConfig } from '@/types/widget'
import { z } from 'zod'

// Widget configuration interface
export interface WeatherWidgetConfig extends BaseWidgetConfig {
  location: string
  size: 'small' | 'medium' | 'large'
  unit: 'celsius' | 'fahrenheit'
  showAdditionalInfo: boolean
}

// Default configuration values
export const widgetDefaults: Required<WeatherWidgetConfig> = {
  location: 'Paris',
  size: 'medium',
  unit: 'celsius',
  showAdditionalInfo: true,
  minWidth: 200,
  minHeight: 200,
}

// Widget configuration groups for UI
export const widgetConfig = {
  groups: [
    {
      id: 'location',
      label: 'Location',
      defaultOpen: true,
      options: {
        location: {
          type: 'text',
          label: 'City Name',
          description: 'Enter the city name for weather data',
          placeholder: 'e.g., Paris, London, New York'
        }
      }
    },
    {
      id: 'display',
      label: 'Display Settings',
      collapsible: true,
      options: {
        size: {
          type: 'select',
          label: 'Display Size',
          options: [
            { value: 'small', label: 'Small' },
            { value: 'medium', label: 'Medium' },
            { value: 'large', label: 'Large' }
          ]
        },
        unit: {
          type: 'select',
          label: 'Temperature Unit',
          options: [
            { value: 'celsius', label: 'Celsius (°C)' },
            { value: 'fahrenheit', label: 'Fahrenheit (°F)' }
          ]
        },
        showAdditionalInfo: {
          type: 'toggle',
          label: 'Show Additional Info',
          description: 'Display humidity and wind speed'
        }
      }
    }
  ]
}

// Validation schema
export const WidgetConfigSchema = z.object({
  location: z.string().min(1),
  size: z.enum(['small', 'medium', 'large']),
  unit: z.enum(['celsius', 'fahrenheit']),
  showAdditionalInfo: z.boolean(),
  minWidth: z.number().min(1),
  minHeight: z.number().min(1)
})