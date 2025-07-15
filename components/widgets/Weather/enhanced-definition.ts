import type { EnhancedWidgetConfig } from '@/types/widget-options'
import { TEXT_SIZE_OPTIONS, FONT_SIZE_PRESETS } from '@/types/widget-options'

export const enhancedWeatherConfig: EnhancedWidgetConfig = {
  groups: [
    {
      id: 'location',
      label: 'Location Settings',
      description: 'Configure weather location',
      defaultOpen: true,
      options: {
        location: {
          type: 'text',
          label: 'City Name',
          description: 'Enter the city name for weather data',
          placeholder: 'Paris, London, New York...'
        }
      }
    },
    {
      id: 'display',
      label: 'Display Options',
      description: 'Choose what weather information to show',
      defaultOpen: true,
      options: {
        showTemperature: {
          type: 'toggle',
          label: 'Show Temperature',
          description: 'Display the current temperature'
        },
        showCondition: {
          type: 'toggle',
          label: 'Show Weather Condition',
          description: 'Display weather description (e.g., "Sunny", "Cloudy")'
        },
        showIcon: {
          type: 'toggle',
          label: 'Show Weather Icon',
          description: 'Display visual weather icon'
        },
        showLocation: {
          type: 'toggle',
          label: 'Show Location Name',
          description: 'Display the city name above weather data'
        }
      }
    },
    {
      id: 'appearance',
      label: 'Appearance',
      description: 'Customize text sizes and layout',
      collapsible: true,
      options: {
        temperatureSize: {
          type: 'slider',
          label: 'Temperature Size',
          description: 'Font size for temperature display',
          min: 16,
          max: 96,
          step: 2,
          unit: 'px',
          dependencies: { showTemperature: true }
        },
        locationSize: {
          type: 'slider',
          label: 'Location Size',
          description: 'Font size for location name',
          min: 12,
          max: 48,
          step: 2,
          unit: 'px',
          dependencies: { showLocation: true }
        },
        conditionSize: {
          type: 'slider',
          label: 'Condition Size',
          description: 'Font size for weather condition',
          min: 12,
          max: 36,
          step: 2,
          unit: 'px',
          dependencies: { showCondition: true }
        },
        iconSize: {
          type: 'select',
          label: 'Icon Size',
          description: 'Size of the weather icon',
          options: [
            { value: 'w-6 h-6', label: 'Small', description: '24px' },
            { value: 'w-8 h-8', label: 'Medium', description: '32px' },
            { value: 'w-12 h-12', label: 'Large', description: '48px' },
            { value: 'w-16 h-16', label: 'Extra Large', description: '64px' },
            { value: 'w-20 h-20', label: 'XXL', description: '80px' },
            { value: 'w-24 h-24', label: 'XXXL', description: '96px' }
          ],
          dependencies: { showIcon: true }
        }
      }
    }
  ]
}