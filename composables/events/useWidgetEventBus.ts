import { onUnmounted } from 'vue'
import { getWidgetEventBus } from '~/lib/events/widget-event-bus'
import type { WidgetEvents } from '~/lib/events/widget-events'

/**
 * Composable for accessing the widget event bus
 * Automatically cleans up event listeners when component is unmounted
 */
export function useWidgetEventBus() {
  const listeners: Array<() => void> = []
  
  // Get the global event bus instance (initialized by plugin)
  const getEventBus = () => {
    if (typeof window === 'undefined') {
      // During SSR, return a mock event bus
      return {
        emit: () => {},
        on: () => () => {},
        off: () => {},
        once: () => {}
      }
    }
    return getWidgetEventBus()
  }
  
  const emit = <K extends keyof WidgetEvents>(
    event: K, 
    ...args: WidgetEvents[K]
  ): void => {
    try {
      const eventBus = getEventBus()
      eventBus.emit(event, ...args)
    } catch (error) {
      console.error(`Failed to emit event '${String(event)}':`, error)
    }
  }
  
  const on = <K extends keyof WidgetEvents>(
    event: K, 
    handler: (...args: WidgetEvents[K]) => void
  ): (() => void) => {
    try {
      const eventBus = getEventBus()
      const unsubscribe = eventBus.on(event, handler)
      listeners.push(unsubscribe)
      return unsubscribe
    } catch (error) {
      console.error(`Failed to add listener for event '${String(event)}':`, error)
      return () => {} // Return noop function
    }
  }
  
  const off = <K extends keyof WidgetEvents>(
    event: K, 
    handler: (...args: WidgetEvents[K]) => void
  ): void => {
    try {
      const eventBus = getEventBus()
      eventBus.off(event, handler)
    } catch (error) {
      console.error(`Failed to remove listener for event '${String(event)}':`, error)
    }
  }
  
  const once = <K extends keyof WidgetEvents>(
    event: K, 
    handler: (...args: WidgetEvents[K]) => void
  ): void => {
    try {
      const eventBus = getEventBus()
      const wrappedHandler = (...args: WidgetEvents[K]) => {
        handler(...args)
        const index = listeners.findIndex(fn => fn === unsubscribe)
        if (index !== -1) {
          listeners.splice(index, 1)
        }
      }
      const unsubscribe = eventBus.on(event, wrappedHandler)
      listeners.push(unsubscribe)
    } catch (error) {
      console.error(`Failed to add once listener for event '${String(event)}':`, error)
    }
  }
  
  // Cleanup on unmount
  onUnmounted(() => {
    listeners.forEach(unsubscribe => unsubscribe())
    listeners.length = 0
  })
  
  return {
    emit,
    on,
    off,
    once
  }
}