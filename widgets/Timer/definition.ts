import type { BaseWidgetConfig } from '@/types/widget'
import { z } from 'zod'

// Widget configuration interface
export interface TimerWidgetConfig extends BaseWidgetConfig {
  defaultDuration: number // in seconds
  size: 'small' | 'medium' | 'large'
  variant: 'default' | 'secondary' | 'outline' | 'ghost'
  enableSound: boolean
  autoRepeat: boolean
}

// Default configuration values
export const widgetDefaults: Required<TimerWidgetConfig> = {
  defaultDuration: 300, // 5 minutes
  size: 'medium',
  variant: 'default',
  enableSound: true,
  autoRepeat: false,
  minWidth: 250,
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
        autoRepeat: {
          type: 'toggle',
          label: 'Auto Repeat',
          description: 'Automatically restart timer when complete'
        }
      }
    },
    {
      id: 'appearance',
      label: 'Appearance',
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
        variant: {
          type: 'select',
          label: 'Button Style',
          options: [
            { value: 'default', label: 'Default' },
            { value: 'secondary', label: 'Secondary' },
            { value: 'outline', label: 'Outline' },
            { value: 'ghost', label: 'Ghost' }
          ]
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
          label: 'Enable Sound Alert',
          description: 'Play a sound when timer completes'
        }
      }
    }
  ]
}

// Validation schema
export const WidgetConfigSchema = z.object({
  defaultDuration: z.number().min(60).max(3600),
  size: z.enum(['small', 'medium', 'large']),
  variant: z.enum(['default', 'secondary', 'outline', 'ghost']),
  enableSound: z.boolean(),
  autoRepeat: z.boolean(),
  minWidth: z.number().min(1),
  minHeight: z.number().min(1)
})