import { getWidgetEventBus } from '~/lib/events/widget-event-bus'

export default defineNuxtPlugin(() => {
  // Only initialize on client side
  if (process.server) return
  
  const eventBus = getWidgetEventBus()
  
  // Subscribe to theme changes by watching the HTML class
  if (typeof document !== 'undefined') {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const isDark = document.documentElement.classList.contains('dark')
          eventBus.emit('theme:changed', isDark)
        }
      })
    })
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
  }
  
  // Log initialization in dev mode
  if (process.dev) {
    console.log('[ThemeObserver] Initialized')
  }
})