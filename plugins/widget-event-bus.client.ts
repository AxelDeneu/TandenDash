import { getWidgetEventBus } from '~/lib/events/widget-event-bus'
import { getDefaultMiddleware } from '~/lib/events/widget-event-middleware'

export default defineNuxtPlugin(() => {
  // Only initialize on client side
  if (process.server) return
  
  const eventBus = getWidgetEventBus()
  
  // Add default middleware
  const middleware = getDefaultMiddleware()
  middleware.forEach(m => {
    if ('addMiddleware' in eventBus) {
      (eventBus as any).addMiddleware(m.handler)
    }
  })
  
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
  
  // Log initialization
  if (process.dev) {
    console.log('[WidgetEventBus] Initialized with middleware:', middleware.map(m => m.name))
  }
  
  return {
    provide: {
      widgetEventBus: eventBus
    }
  }
})