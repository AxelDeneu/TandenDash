import type { EnhancedWidgetConfig } from '@/types/widget-options'
import { enhancedClockConfig } from '@/components/widgets/Clock/enhanced-definition'
import { enhancedWeatherConfig } from '@/components/widgets/Weather/enhanced-definition'
import { enhancedCalendarConfig } from '@/components/widgets/Calendar/enhanced-definition'
import { enhancedNoteConfig } from '@/components/widgets/Note/enhanced-definition'
import { enhancedTimerConfig } from '@/components/widgets/Timer/enhanced-definition'

// Mapping of widget types to their enhanced configurations
export const ENHANCED_WIDGET_CONFIGS: Record<string, EnhancedWidgetConfig> = {
  clock: enhancedClockConfig,
  weather: enhancedWeatherConfig,
  calendar: enhancedCalendarConfig,
  note: enhancedNoteConfig,
  timer: enhancedTimerConfig
}

/**
 * Get enhanced configuration for a widget type
 */
export function getEnhancedWidgetConfig(widgetType: string): EnhancedWidgetConfig | undefined {
  return ENHANCED_WIDGET_CONFIGS[widgetType]
}

/**
 * Check if a widget type has enhanced configuration
 */
export function hasEnhancedConfig(widgetType: string): boolean {
  return widgetType in ENHANCED_WIDGET_CONFIGS
}

/**
 * Get human-readable widget type name
 */
export function getWidgetDisplayName(widgetType: string): string {
  const displayNames: Record<string, string> = {
    clock: 'Clock',
    weather: 'Weather',
    calendar: 'Calendar',
    note: 'Note',
    timer: 'Timer'
  }
  return displayNames[widgetType] || widgetType
}