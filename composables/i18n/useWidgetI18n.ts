import { computed, onMounted, onUnmounted, ref, watch, readonly, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Locale } from '@nuxtjs/i18n'

export interface WidgetI18nOptions {
  widgetName: string
  fallbackLocale?: string
}

export function useWidgetI18n(options: WidgetI18nOptions) {
  const { locale, t: globalT, mergeLocaleMessage, getLocaleMessage } = useI18n()
  const loading = ref(true)
  const error = ref<Error | null>(null)
  
  // Widget-specific translation namespace
  const namespace = `widget_${options.widgetName}`
  
  // Load widget translations
  const loadTranslations = async () => {
    try {
      loading.value = true
      error.value = null
      
      // Get current locale
      const currentLocale = locale.value as string
      
      let translations: any = null
      
      // Try to import the translations from the widget's lang directory
      try {
        // Use a more reliable path for the import
        const module = await import(`../../widgets/${options.widgetName}/lang/${currentLocale}.json`)
        translations = module.default || module
      } catch (importError) {
        // Try fallback locale if main locale fails
        if (options.fallbackLocale && options.fallbackLocale !== currentLocale) {
          try {
            const fallbackModule = await import(`../../widgets/${options.widgetName}/lang/${options.fallbackLocale}.json`)
            translations = fallbackModule.default || fallbackModule
            console.warn(`Using fallback locale '${options.fallbackLocale}' for widget ${options.widgetName}`)
          } catch (fallbackError) {
            console.warn(`No translations found for widget ${options.widgetName} in '${currentLocale}' or '${options.fallbackLocale}'`)
          }
        } else {
          console.warn(`No translations found for widget ${options.widgetName} in locale '${currentLocale}'`)
        }
      }
      
      if (translations) {
        // Merge translations under widget namespace
        mergeLocaleMessage(currentLocale, {
          [namespace]: translations
        })
      }
    } catch (err) {
      error.value = err as Error
      console.error(`Failed to load translations for widget ${options.widgetName}:`, err)
    } finally {
      loading.value = false
    }
  }
  
  // Custom translation function with widget namespace
  const t = (key: string, ...args: any[]) => {
    // First try widget-specific translation
    const widgetKey = `${namespace}.${key}`
    const widgetTranslation = globalT(widgetKey, ...args)
    
    // If translation exists and is not the key itself, return it
    if (widgetTranslation !== widgetKey) {
      return widgetTranslation
    }
    
    // Otherwise, try global translation
    return globalT(key, ...args)
  }
  
  // Check if translation exists
  const te = (key: string): boolean => {
    const widgetKey = `${namespace}.${key}`
    const messages = getLocaleMessage(locale.value as string)
    
    // Check widget namespace
    const widgetMessages = messages[namespace] as Record<string, any>
    if (widgetMessages) {
      const keys = key.split('.')
      let current: any = widgetMessages
      
      for (const k of keys) {
        if (current && typeof current === 'object' && k in current) {
          current = current[k]
        } else {
          return false
        }
      }
      
      return true
    }
    
    return false
  }
  
  // Get all widget translations
  const messages = computed(() => {
    const currentMessages = getLocaleMessage(locale.value as string)
    return currentMessages[namespace] || {}
  })
  
  // Load translations immediately
  loadTranslations()
  
  // Reload translations when locale changes
  const reloadOnLocaleChange = () => {
    const unwatch = watch(() => locale.value, () => {
      loadTranslations()
    })
    
    // Clean up watcher on unmount
    onUnmounted(unwatch)
  }
  
  return {
    // Translation function
    t,
    
    // Check if translation exists
    te,
    
    // Current locale
    locale: locale as Ref<Locale>,
    
    // Widget messages
    messages,
    
    // Loading state
    loading: readonly(loading),
    
    // Error state
    error: readonly(error),
    
    // Reload translations
    reload: loadTranslations,
    
    // Enable auto-reload on locale change
    enableAutoReload: reloadOnLocaleChange
  }
}

// Helper function to create widget translation files
export function createWidgetTranslationHelper(widgetName: string) {
  return {
    // Get path to translation file
    getTranslationPath: (locale: string) => `/widgets/${widgetName}/lang/${locale}.json`,
    
    // Get translation key with widget namespace
    getKey: (key: string) => `widget_${widgetName}.${key}`,
    
    // Widget namespace
    namespace: `widget_${widgetName}`
  }
}