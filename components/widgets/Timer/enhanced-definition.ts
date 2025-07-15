import type { EnhancedWidgetConfig } from '@/types/widget-options'

export const enhancedTimerConfig: EnhancedWidgetConfig = {
  name: 'Timer',
  description: 'A countdown timer with customizable durations and alerts',
  groups: [
    {
      id: 'timer',
      label: 'Timer Settings',
      options: [
        {
          id: 'defaultDuration',
          type: 'slider',
          label: 'Default Duration',
          defaultValue: 300,
          min: 60,
          max: 3600,
          step: 60,
          unit: ' seconds',
          description: 'Default countdown duration'
        },
        {
          id: 'showHours',
          type: 'toggle',
          label: 'Show Hours',
          defaultValue: true,
          description: 'Display hours in timer'
        },
        {
          id: 'showMilliseconds',
          type: 'toggle',
          label: 'Show Milliseconds',
          defaultValue: false,
          description: 'Display milliseconds for precision'
        },
        {
          id: 'autoRepeat',
          type: 'toggle',
          label: 'Auto Repeat',
          defaultValue: false,
          description: 'Automatically restart timer when complete'
        }
      ]
    },
    {
      id: 'display',
      label: 'Display',
      options: [
        {
          id: 'fontSize',
          type: 'slider',
          label: 'Timer Font Size',
          defaultValue: 48,
          min: 16,
          max: 72,
          unit: 'px'
        },
        {
          id: 'timerColor',
          type: 'select',
          label: 'Timer Text Color',
          defaultValue: 'text-foreground',
          options: [
            { value: 'text-foreground', label: 'Default' },
            { value: 'text-primary', label: 'Primary' },
            { value: 'text-gray-900 dark:text-gray-100', label: 'High Contrast' },
            { value: 'text-blue-600 dark:text-blue-400', label: 'Blue' }
          ]
        },
        {
          id: 'buttonColor',
          type: 'select',
          label: 'Button Color',
          defaultValue: 'bg-primary text-primary-foreground',
          options: [
            { value: 'bg-primary text-primary-foreground', label: 'Primary' },
            { value: 'bg-blue-500 text-white hover:bg-blue-600', label: 'Blue' },
            { value: 'bg-green-500 text-white hover:bg-green-600', label: 'Green' },
            { value: 'bg-gray-500 text-white hover:bg-gray-600', label: 'Gray' }
          ]
        }
      ]
    },
    {
      id: 'progress',
      label: 'Progress Bar',
      options: [
        {
          id: 'showProgressBar',
          type: 'toggle',
          label: 'Show Progress Bar',
          defaultValue: true
        },
        {
          id: 'progressBarColor',
          type: 'select',
          label: 'Progress Bar Color',
          defaultValue: 'bg-primary',
          options: [
            { value: 'bg-primary', label: 'Primary' },
            { value: 'bg-blue-500', label: 'Blue' },
            { value: 'bg-green-500', label: 'Green' },
            { value: 'bg-yellow-500', label: 'Yellow' },
            { value: 'bg-red-500', label: 'Red' }
          ],
          showIf: { showProgressBar: true }
        },
        {
          id: 'progressBarHeight',
          type: 'slider',
          label: 'Progress Bar Height',
          defaultValue: 4,
          min: 1,
          max: 20,
          unit: 'px',
          showIf: { showProgressBar: true }
        }
      ]
    },
    {
      id: 'alerts',
      label: 'Alerts',
      options: [
        {
          id: 'enableSound',
          type: 'toggle',
          label: 'Enable Sound Alert',
          defaultValue: true
        },
        {
          id: 'soundVolume',
          type: 'slider',
          label: 'Alert Volume',
          defaultValue: 0.5,
          min: 0,
          max: 1,
          step: 0.1,
          showIf: { enableSound: true }
        }
      ]
    },
    {
      id: 'appearance',
      label: 'Appearance',
      options: [
        {
          id: 'backgroundColor',
          type: 'select',
          label: 'Background Color',
          defaultValue: 'bg-background',
          options: [
            { value: 'bg-background', label: 'Default' },
            { value: 'bg-white dark:bg-gray-900', label: 'White/Dark' },
            { value: 'bg-gray-50 dark:bg-gray-800', label: 'Light Gray' },
            { value: 'bg-blue-50 dark:bg-blue-900/20', label: 'Light Blue' }
          ]
        },
        {
          id: 'borderRadius',
          type: 'slider',
          label: 'Border Radius',
          defaultValue: 12,
          min: 0,
          max: 32,
          unit: 'px'
        },
        {
          id: 'showBorder',
          type: 'toggle',
          label: 'Show Border',
          defaultValue: true
        },
        {
          id: 'borderColor',
          type: 'select',
          label: 'Border Color',
          defaultValue: 'border-border',
          options: [
            { value: 'border-border', label: 'Default' },
            { value: 'border-gray-200 dark:border-gray-700', label: 'Gray' },
            { value: 'border-transparent', label: 'None' }
          ],
          showIf: { showBorder: true }
        }
      ]
    }
  ]
}