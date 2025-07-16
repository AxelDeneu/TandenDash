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
  hourColor: 'text-black',
  minuteColor: 'text-black',
  secondColor: 'text-black',
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
      label: 'Display Options',
      description: 'Configure what information to show',
      defaultOpen: true,
      options: {
        showSeconds: {
          type: 'toggle',
          label: 'Show Seconds',
          description: 'Display seconds in the time'
        },
        showDate: {
          type: 'toggle',
          label: 'Show Date',
          description: 'Display the current date below the time'
        },
        format: {
          type: 'radio',
          label: 'Time Format',
          description: 'Choose between 12-hour or 24-hour format',
          options: [
            { value: '12', label: '12 Hour', description: '1:30 PM' },
            { value: '24', label: '24 Hour', description: '13:30' }
          ]
        },
        alignment: {
          type: 'radio',
          label: 'Layout',
          description: 'Arrange time elements',
          options: [
            { value: 'vertical', label: 'Vertical', description: 'Stack time and date vertically', icon: 'AlignVertical' },
            { value: 'horizontal', label: 'Horizontal', description: 'Place time and date side by side', icon: 'AlignHorizontal' }
          ]
        }
      }
    },
    {
      id: 'appearance',
      label: 'Appearance',
      description: 'Customize colors and sizes',
      collapsible: true,
      options: {
        hourSize: {
          type: 'slider',
          label: 'Hour Size',
          description: 'Font size for hour digits',
          min: 12,
          max: 96,
          step: 2,
          unit: 'px'
        },
        minuteSize: {
          type: 'slider',
          label: 'Minute Size',
          description: 'Font size for minute digits',
          min: 12,
          max: 96,
          step: 2,
          unit: 'px'
        },
        secondSize: {
          type: 'slider',
          label: 'Second Size',
          description: 'Font size for second digits',
          min: 12,
          max: 96,
          step: 2,
          unit: 'px',
          dependencies: { showSeconds: true }
        },
        separatorSize: {
          type: 'slider',
          label: 'Separator Size',
          description: 'Font size for time separator (:)',
          min: 12,
          max: 72,
          step: 2,
          unit: 'px'
        },
        hourColor: {
          type: 'select',
          label: 'Hour Color',
          description: 'Color for hour digits',
          options: COLOR_OPTIONS
        },
        minuteColor: {
          type: 'select',
          label: 'Minute Color',
          description: 'Color for minute digits',
          options: COLOR_OPTIONS
        },
        secondColor: {
          type: 'select',
          label: 'Second Color',
          description: 'Color for second digits',
          options: COLOR_OPTIONS,
          dependencies: { showSeconds: true }
        },
        backgroundColor: {
          type: 'select',
          label: 'Background Color',
          description: 'Background color for the widget',
          options: BACKGROUND_COLOR_OPTIONS
        }
      }
    },
    {
      id: 'animations',
      label: 'Animations',
      description: 'Configure movement and transitions',
      collapsible: true,
      options: {
        animateSeparator: {
          type: 'toggle',
          label: 'Animate Separator',
          description: 'Make the time separator blink or pulse'
        },
        animateSeconds: {
          type: 'toggle',
          label: 'Animate Seconds',
          description: 'Add animation effects to seconds',
          dependencies: { showSeconds: true }
        },
        secondsAnimation: {
          type: 'select',
          label: 'Seconds Animation Type',
          description: 'Choose the animation style for seconds',
          options: [
            { value: 'bounce', label: 'Bounce', description: 'Bouncy effect on second change' },
            { value: 'spin', label: 'Spin', description: 'Rotate on second change' },
            { value: 'fade', label: 'Fade', description: 'Fade in/out on second change' }
          ],
          dependencies: { showSeconds: true, animateSeconds: true }
        }
      }
    },
    {
      id: 'spacing',
      label: 'Spacing & Layout',
      description: 'Fine-tune spacing and positioning',
      collapsible: true,
      options: {
        separator: {
          type: 'text',
          label: 'Time Separator',
          description: 'Character to separate time components',
          placeholder: ':'
        },
        timeSeparatorSpacing: {
          type: 'select',
          label: 'Separator Spacing',
          description: 'Horizontal spacing around the separator',
          options: [
            { value: 'mx-0', label: 'None', description: '0px' },
            { value: 'mx-1', label: 'Small', description: '4px' },
            { value: 'mx-2', label: 'Medium', description: '8px' },
            { value: 'mx-3', label: 'Large', description: '12px' },
            { value: 'mx-4', label: 'Extra Large', description: '16px' }
          ]
        },
        dateSpacing: {
          type: 'select',
          label: 'Date Spacing',
          description: 'Vertical spacing between time and date',
          options: [
            { value: 'mt-0', label: 'None', description: '0px' },
            { value: 'mt-1', label: 'Small', description: '4px' },
            { value: 'mt-2', label: 'Medium', description: '8px' },
            { value: 'mt-4', label: 'Large', description: '16px' },
            { value: 'mt-6', label: 'Extra Large', description: '24px' }
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