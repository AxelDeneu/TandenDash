import { useI18n } from 'vue-i18n'
import type { Composer } from 'vue-i18n'

/**
 * Custom i18n composable for widgets that automatically prefixes translation keys
 * with the widget namespace.
 * 
 * @param widgetId - The widget ID as defined in the widget's plugin.ts
 * 
 * @example
 * // In widgets/Calendar/index.vue
 * import { CalendarWidgetPlugin } from './plugin'
 * const { t } = useWidgetI18n(CalendarWidgetPlugin.id)
 * t('views.list') // Returns translation for 'widget_calendar.views.list'
 */
export function useWidgetI18n(widgetId: string) {
  const i18n = useI18n()
  
  const namespace = `widget_${widgetId}`
  
  // Create a wrapper function that prefixes keys with the widget namespace
  const t = (key: string, ...args: any[]) => {
    const prefixedKey = `${namespace}.${key}`
    return i18n.t(prefixedKey, ...args)
  }
  
  // Create a wrapper for tc (translation with choice/pluralization)
  const tc = (key: string, choice: number, ...args: any[]) => {
    const prefixedKey = `${namespace}.${key}`
    return i18n.tc(prefixedKey, choice, ...args)
  }
  
  // Create a wrapper for te (translation exists check)
  const te = (key: string, locale?: string) => {
    const prefixedKey = `${namespace}.${key}`
    return i18n.te(prefixedKey, locale)
  }
  
  // Create a wrapper for tm (get translation messages)
  const tm = (key: string) => {
    const prefixedKey = `${namespace}.${key}`
    return i18n.tm(prefixedKey)
  }
  
  // Return an object with the same interface as useI18n but with wrapped functions
  return {
    ...i18n,
    t,
    tc,
    te,
    tm,
    // Expose the widget ID and namespace for debugging
    widgetId,
    namespace
  }
}

// Type export for better TypeScript support
export type WidgetI18n = ReturnType<typeof useWidgetI18n>