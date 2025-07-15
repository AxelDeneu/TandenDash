import type { BaseWidgetConfig } from '@/types/widget'

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

export const timerWidgetOptions: Required<Omit<TimerWidgetConfig, keyof BaseWidgetConfig>> = {
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
};