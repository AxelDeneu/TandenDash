import type { BaseWidgetConfig } from '@/types/widget'
import { TEXT_SIZE_OPTIONS, COLOR_OPTIONS, BACKGROUND_COLOR_OPTIONS } from '@/types/widget-options'
import { z } from 'zod'

// Widget configuration interface
export interface ClockWidgetConfig extends BaseWidgetConfig {
  showSeconds: boolean
  format: '12' | '24'
  showDate: boolean
  hourSize: string | number
  minuteSize: string | number
  secondSize: string | number
  alignment: 'vertical' | 'horizontal'
  separator: string
  animateSeparator: boolean
  hourColor: string
  minuteColor: string
  secondColor: string
  backgroundColor: string
  separatorSize: string | number
  dateSpacing: string
  secondsAnimation: 'bounce' | 'spin' | 'fade'
  animateSeconds: boolean
  timeSeparatorSpacing: string
}

// Default configuration values
export const widgetDefaults: Required<ClockWidgetConfig> = {
  showSeconds: false,
  format: '24',
  showDate: false,
  hourSize: 36,
  minuteSize: 36,
  secondSize: 36,
  alignment: 'vertical',
  separator: ':',
  animateSeparator: false,
  hourColor: 'text-primary',
  minuteColor: 'text-primary',
  secondColor: 'text-primary',
  backgroundColor: 'bg-transparent',
  separatorSize: 20,
  dateSpacing: 'mt-2',
  secondsAnimation: 'bounce',
  animateSeconds: false,
  timeSeparatorSpacing: 'mx-1',
  minWidth: 300,
  minHeight: 200,
}

// Widget configuration groups for UI
export const widgetConfig = {
  groups: [
    {
      id: 'display',
      label: '@config.groups.display.label',
      description: '@config.groups.display.description',
      defaultOpen: true,
      options: {
        showSeconds: {
          type: 'toggle',
          label: '@config.options.showSeconds.label',
          description: '@config.options.showSeconds.description'
        },
        showDate: {
          type: 'toggle',
          label: '@config.options.showDate.label',
          description: '@config.options.showDate.description'
        },
        format: {
          type: 'radio',
          label: '@config.options.format.label',
          description: '@config.options.format.description',
          options: [
            { value: '12', label: '@config.options.format.options.12.label', description: '@config.options.format.options.12.description' },
            { value: '24', label: '@config.options.format.options.24.label', description: '@config.options.format.options.24.description' }
          ]
        },
        alignment: {
          type: 'radio',
          label: '@config.options.alignment.label',
          description: '@config.options.alignment.description',
          options: [
            { value: 'vertical', label: '@config.options.alignment.options.vertical.label', description: '@config.options.alignment.options.vertical.description', icon: 'AlignVertical' },
            { value: 'horizontal', label: '@config.options.alignment.options.horizontal.label', description: '@config.options.alignment.options.horizontal.description', icon: 'AlignHorizontal' }
          ]
        }
      }
    },
    {
      id: 'appearance',
      label: '@config.groups.appearance.label',
      description: '@config.groups.appearance.description',
      collapsible: true,
      options: {
        hourSize: {
          type: 'slider',
          label: '@config.options.hourSize.label',
          description: '@config.options.hourSize.description',
          min: 12,
          max: 96,
          step: 2,
          unit: 'px'
        },
        minuteSize: {
          type: 'slider',
          label: '@config.options.minuteSize.label',
          description: '@config.options.minuteSize.description',
          min: 12,
          max: 96,
          step: 2,
          unit: 'px'
        },
        secondSize: {
          type: 'slider',
          label: '@config.options.secondSize.label',
          description: '@config.options.secondSize.description',
          min: 12,
          max: 96,
          step: 2,
          unit: 'px',
          dependencies: { showSeconds: true }
        },
        separatorSize: {
          type: 'slider',
          label: '@config.options.separatorSize.label',
          description: '@config.options.separatorSize.description',
          min: 12,
          max: 72,
          step: 2,
          unit: 'px'
        },
        hourColor: {
          type: 'select',
          label: '@config.options.hourColor.label',
          description: '@config.options.hourColor.description',
          options: COLOR_OPTIONS
        },
        minuteColor: {
          type: 'select',
          label: '@config.options.minuteColor.label',
          description: '@config.options.minuteColor.description',
          options: COLOR_OPTIONS
        },
        secondColor: {
          type: 'select',
          label: '@config.options.secondColor.label',
          description: '@config.options.secondColor.description',
          options: COLOR_OPTIONS,
          dependencies: { showSeconds: true }
        },
        backgroundColor: {
          type: 'select',
          label: '@config.options.backgroundColor.label',
          description: '@config.options.backgroundColor.description',
          options: BACKGROUND_COLOR_OPTIONS
        }
      }
    },
    {
      id: 'animations',
      label: '@config.groups.animations.label',
      description: '@config.groups.animations.description',
      collapsible: true,
      options: {
        animateSeparator: {
          type: 'toggle',
          label: '@config.options.animateSeparator.label',
          description: '@config.options.animateSeparator.description'
        },
        animateSeconds: {
          type: 'toggle',
          label: '@config.options.animateSeconds.label',
          description: '@config.options.animateSeconds.description',
          dependencies: { showSeconds: true }
        },
        secondsAnimation: {
          type: 'select',
          label: '@config.options.secondsAnimation.label',
          description: '@config.options.secondsAnimation.description',
          options: [
            { value: 'bounce', label: '@config.options.secondsAnimation.options.bounce.label', description: '@config.options.secondsAnimation.options.bounce.description' },
            { value: 'spin', label: '@config.options.secondsAnimation.options.spin.label', description: '@config.options.secondsAnimation.options.spin.description' },
            { value: 'fade', label: '@config.options.secondsAnimation.options.fade.label', description: '@config.options.secondsAnimation.options.fade.description' }
          ],
          dependencies: { showSeconds: true, animateSeconds: true }
        }
      }
    },
    {
      id: 'spacing',
      label: '@config.groups.spacing.label',
      description: '@config.groups.spacing.description',
      collapsible: true,
      options: {
        separator: {
          type: 'text',
          label: '@config.options.separator.label',
          description: '@config.options.separator.description',
          placeholder: '@config.options.separator.placeholder'
        },
        timeSeparatorSpacing: {
          type: 'select',
          label: '@config.options.timeSeparatorSpacing.label',
          description: '@config.options.timeSeparatorSpacing.description',
          options: [
            { value: 'mx-0', label: '@config.options.timeSeparatorSpacing.options.mx-0.label', description: '@config.options.timeSeparatorSpacing.options.mx-0.description' },
            { value: 'mx-1', label: '@config.options.timeSeparatorSpacing.options.mx-1.label', description: '@config.options.timeSeparatorSpacing.options.mx-1.description' },
            { value: 'mx-2', label: '@config.options.timeSeparatorSpacing.options.mx-2.label', description: '@config.options.timeSeparatorSpacing.options.mx-2.description' },
            { value: 'mx-3', label: '@config.options.timeSeparatorSpacing.options.mx-3.label', description: '@config.options.timeSeparatorSpacing.options.mx-3.description' },
            { value: 'mx-4', label: '@config.options.timeSeparatorSpacing.options.mx-4.label', description: '@config.options.timeSeparatorSpacing.options.mx-4.description' }
          ]
        },
        dateSpacing: {
          type: 'select',
          label: '@config.options.dateSpacing.label',
          description: '@config.options.dateSpacing.description',
          options: [
            { value: 'mt-0', label: '@config.options.dateSpacing.options.mt-0.label', description: '@config.options.dateSpacing.options.mt-0.description' },
            { value: 'mt-1', label: '@config.options.dateSpacing.options.mt-1.label', description: '@config.options.dateSpacing.options.mt-1.description' },
            { value: 'mt-2', label: '@config.options.dateSpacing.options.mt-2.label', description: '@config.options.dateSpacing.options.mt-2.description' },
            { value: 'mt-4', label: '@config.options.dateSpacing.options.mt-4.label', description: '@config.options.dateSpacing.options.mt-4.description' },
            { value: 'mt-6', label: '@config.options.dateSpacing.options.mt-6.label', description: '@config.options.dateSpacing.options.mt-6.description' }
          ],
          dependencies: { showDate: true }
        }
      }
    }
  ]
}

// Validation schema
export const WidgetConfigSchema = z.object({
  showSeconds: z.boolean(),
  format: z.enum(['12', '24']),
  showDate: z.boolean(),
  hourSize: z.union([z.string(), z.number()]),
  minuteSize: z.union([z.string(), z.number()]),
  secondSize: z.union([z.string(), z.number()]),
  alignment: z.enum(['vertical', 'horizontal']),
  separator: z.string(),
  animateSeparator: z.boolean(),
  hourColor: z.string(),
  minuteColor: z.string(),
  secondColor: z.string(),
  backgroundColor: z.string(),
  separatorSize: z.union([z.string(), z.number()]),
  dateSpacing: z.string(),
  secondsAnimation: z.enum(['bounce', 'spin', 'fade']),
  animateSeconds: z.boolean(),
  timeSeparatorSpacing: z.string(),
  minWidth: z.number().min(1),
  minHeight: z.number().min(1)
})