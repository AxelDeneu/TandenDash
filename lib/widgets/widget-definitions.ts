// Widget definitions for backward compatibility
import type { Component } from 'vue'
import type { WidgetDefinitionCompat } from '@/composables/widgets/useWidgetRegistry'

// Import widget components
import ClockWidget from '@/components/widgets/Clock/index.vue'
import WeatherWidget from '@/components/widgets/Weather/index.vue'
import CalendarWidget from '@/components/widgets/Calendar/index.vue'
import NoteWidget from '@/components/widgets/Note/index.vue'
import TimerWidget from '@/components/widgets/Timer/index.vue'

// Import default configs
import { clockWidgetOptions } from '@/components/widgets/Clock/definition'
import { weatherWidgetOptions } from '@/components/widgets/Weather/definition'
import { calendarWidgetOptions } from '@/components/widgets/Calendar/definition'
import { noteWidgetOptions } from '@/components/widgets/Note/definition'
import { timerWidgetOptions } from '@/components/widgets/Timer/definition'

// Define widgets in the old format for compatibility
export const WIDGET_DEFINITIONS: WidgetDefinitionCompat[] = [
  {
    name: 'clock',
    component: ClockWidget as Component,
    defaultConfig: clockWidgetOptions as any
  },
  {
    name: 'weather',
    component: WeatherWidget as Component,
    defaultConfig: weatherWidgetOptions as any
  },
  {
    name: 'calendar',
    component: CalendarWidget as Component,
    defaultConfig: calendarWidgetOptions as any
  },
  {
    name: 'note',
    component: NoteWidget as Component,
    defaultConfig: noteWidgetOptions as any
  },
  {
    name: 'timer',
    component: TimerWidget as Component,
    defaultConfig: timerWidgetOptions as any
  }
]