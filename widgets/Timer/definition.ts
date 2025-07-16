import type { BaseWidgetConfig } from '@/types/widget'
import { z } from 'zod'

// Widget configuration interface
export interface TimerWidgetConfig extends BaseWidgetConfig {
  defaultDuration: number // in seconds
  showHours: boolean
  showMilliseconds: boolean
  fontSize: number
  timerColor: string
  buttonColor: string
  backgroundColor: string
  borderRadius: number
  showBorder: boolean
  borderColor: string
  enableSound: boolean
  soundVolume: number
  autoRepeat: boolean
  showProgressBar: boolean
  progressBarColor: string
  progressBarHeight: number
}

// Default configuration values
export const widgetDefaults: Required<TimerWidgetConfig> = {
  defaultDuration: 300, // 5 minutes
  showHours: true,
  showMilliseconds: false,
  fontSize: 48,
  timerColor: 'text-foreground',
  buttonColor: 'bg-primary text-primary-foreground',
  backgroundColor: 'bg-background',
  borderRadius: 12,
  showBorder: true,
  borderColor: 'border-border',
  enableSound: true,
  soundVolume: 0.5,
  autoRepeat: false,
  showProgressBar: true,
  progressBarColor: 'bg-primary',
  progressBarHeight: 4,
  minWidth: 300,
  minHeight: 200,
}

// Widget configuration groups for UI
export const widgetConfig = {
  groups: [
    {
      id: 'timer',
      label: 'Timer Settings',
      defaultOpen: true,
      options: {
        defaultDuration: {
          type: 'slider',
          label: 'Default Duration',
          min: 60,
          max: 3600,
          step: 60,
          unit: ' seconds',
          description: 'Default countdown duration'
        },
        showHours: {
          type: 'toggle',
          label: 'Show Hours',
          description: 'Display hours in timer'
        },
        showMilliseconds: {
          type: 'toggle',
          label: 'Show Milliseconds',
          description: 'Display milliseconds for precision'
        },
        autoRepeat: {
          type: 'toggle',
          label: 'Auto Repeat',
          description: 'Automatically restart timer when complete'
        }
      }
    },
    {
      id: 'display',
      label: 'Display',
      collapsible: true,
      options: {
        fontSize: {
          type: 'slider',
          label: 'Timer Font Size',
          min: 16,
          max: 72,
          unit: 'px'
        },
        timerColor: {
          type: 'select',
          label: 'Timer Text Color',
          options: [
            { value: 'text-foreground', label: 'Default' },
            { value: 'text-primary', label: 'Primary' },
            { value: 'text-gray-900 dark:text-gray-100', label: 'High Contrast' },
            { value: 'text-blue-600 dark:text-blue-400', label: 'Blue' }
          ]
        },
        buttonColor: {
          type: 'select',
          label: 'Button Color',
          options: [
            { value: 'bg-primary text-primary-foreground', label: 'Primary' },
            { value: 'bg-blue-500 text-white hover:bg-blue-600', label: 'Blue' },
            { value: 'bg-green-500 text-white hover:bg-green-600', label: 'Green' },
            { value: 'bg-gray-500 text-white hover:bg-gray-600', label: 'Gray' }
          ]
        }
      }
    },
    {
      id: 'progress',
      label: 'Progress Bar',
      collapsible: true,
      options: {
        showProgressBar: {
          type: 'toggle',
          label: 'Show Progress Bar'
        },
        progressBarColor: {
          type: 'select',
          label: 'Progress Bar Color',
          options: [
            { value: 'bg-primary', label: 'Primary' },
            { value: 'bg-blue-500', label: 'Blue' },
            { value: 'bg-green-500', label: 'Green' },
            { value: 'bg-yellow-500', label: 'Yellow' },
            { value: 'bg-red-500', label: 'Red' }
          ],
          dependencies: { showProgressBar: true }
        },
        progressBarHeight: {
          type: 'slider',
          label: 'Progress Bar Height',
          min: 1,
          max: 20,
          unit: 'px',
          dependencies: { showProgressBar: true }
        }
      }
    },
    {
      id: 'alerts',
      label: 'Alerts',
      collapsible: true,
      options: {
        enableSound: {
          type: 'toggle',
          label: 'Enable Sound Alert'
        },
        soundVolume: {
          type: 'slider',
          label: 'Alert Volume',
          min: 0,
          max: 1,
          step: 0.1,
          dependencies: { enableSound: true }
        }
      }
    },
    {
      id: 'appearance',
      label: 'Appearance',
      collapsible: true,
      options: {
        backgroundColor: {
          type: 'select',
          label: 'Background Color',
          options: [
            { value: 'bg-background', label: 'Default' },
            { value: 'bg-white dark:bg-gray-900', label: 'White/Dark' },
            { value: 'bg-gray-50 dark:bg-gray-800', label: 'Light Gray' },
            { value: 'bg-blue-50 dark:bg-blue-900/20', label: 'Light Blue' }
          ]
        },
        borderRadius: {
          type: 'slider',
          label: 'Border Radius',
          min: 0,
          max: 32,
          unit: 'px'
        },
        showBorder: {
          type: 'toggle',
          label: 'Show Border'
        },
        borderColor: {
          type: 'select',
          label: 'Border Color',
          options: [
            { value: 'border-border', label: 'Default' },
            { value: 'border-gray-200 dark:border-gray-700', label: 'Gray' },
            { value: 'border-transparent', label: 'None' }
          ],
          dependencies: { showBorder: true }
        }
      }
    }
  ]
}

// Validation schema
export const WidgetConfigSchema = z.object({
  defaultDuration: z.number().min(60).max(3600),
  showHours: z.boolean(),
  showMilliseconds: z.boolean(),
  fontSize: z.number().min(16).max(72),
  timerColor: z.string(),
  buttonColor: z.string(),
  backgroundColor: z.string(),
  borderRadius: z.number().min(0).max(32),
  showBorder: z.boolean(),
  borderColor: z.string(),
  enableSound: z.boolean(),
  soundVolume: z.number().min(0).max(1),
  autoRepeat: z.boolean(),
  showProgressBar: z.boolean(),
  progressBarColor: z.string(),
  progressBarHeight: z.number().min(1).max(20),
  minWidth: z.number().min(1),
  minHeight: z.number().min(1)
})