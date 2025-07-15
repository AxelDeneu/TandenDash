import { createEventEmitter } from '~/composables/core/EventEmitter'
import type { WidgetEvents, WidgetEventBus } from './widget-events'
import type { EventEmitter } from '~/composables/core/interfaces'
import { validateEventPayloadLenient } from './widget-event-validation'

class WidgetEventBusImpl implements WidgetEventBus {
  private emitter: EventEmitter<WidgetEvents>
  private middleware: Array<(event: keyof WidgetEvents, args: unknown[]) => boolean> = []
  
  constructor() {
    // Create event emitter with lenient validation
    this.emitter = createEventEmitter<WidgetEvents>(validateEventPayloadLenient)
  }
  
  addMiddleware(fn: (event: keyof WidgetEvents, args: unknown[]) => boolean): void {
    this.middleware.push(fn)
  }
  
  removeMiddleware(fn: (event: keyof WidgetEvents, args: unknown[]) => boolean): void {
    const index = this.middleware.indexOf(fn)
    if (index !== -1) {
      this.middleware.splice(index, 1)
    }
  }
  
  emit<K extends keyof WidgetEvents>(event: K, ...args: WidgetEvents[K]): void {
    // Run middleware
    for (const fn of this.middleware) {
      if (!fn(event, args)) {
        return // Middleware cancelled event
      }
    }
    
    // Log event in development
    if (process.dev) {
      console.log(`[WidgetEventBus] ${String(event)}`, ...args)
    }
    
    this.emitter.emit(event, ...args)
  }
  
  on<K extends keyof WidgetEvents>(
    event: K, 
    handler: (...args: WidgetEvents[K]) => void
  ): () => void {
    return this.emitter.on(event, handler)
  }
  
  off<K extends keyof WidgetEvents>(
    event: K, 
    handler: (...args: WidgetEvents[K]) => void
  ): void {
    this.emitter.off(event, handler)
  }
  
  once<K extends keyof WidgetEvents>(
    event: K, 
    handler: (...args: WidgetEvents[K]) => void
  ): void {
    this.emitter.once(event, handler)
  }
  
  // Additional utility methods
  removeAllListeners<K extends keyof WidgetEvents>(event?: K): void {
    if ('removeAllListeners' in this.emitter) {
      (this.emitter as any).removeAllListeners(event)
    }
  }
  
  listenerCount<K extends keyof WidgetEvents>(event: K): number {
    if ('listenerCount' in this.emitter) {
      return (this.emitter as any).listenerCount(event)
    }
    return 0
  }
  
  eventNames(): (keyof WidgetEvents)[] {
    if ('eventNames' in this.emitter) {
      return (this.emitter as any).eventNames()
    }
    return []
  }
}

// Singleton instance
let widgetEventBus: WidgetEventBusImpl | null = null

export function getWidgetEventBus(): WidgetEventBus {
  if (!widgetEventBus) {
    widgetEventBus = new WidgetEventBusImpl()
  }
  return widgetEventBus
}

// For testing purposes
export function resetWidgetEventBus(): void {
  widgetEventBus = null
}