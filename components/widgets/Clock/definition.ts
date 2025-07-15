import type { BaseWidgetConfig } from '@/types/widget'

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

export const clockWidgetOptions: Required<ClockWidgetConfig> = {
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
}; 