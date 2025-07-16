import { createEventEmitter } from '~/composables/core/EventEmitter'
import type { WidgetEvents, WidgetEventBus } from './widget-events'
import type { EventEmitter } from '~/composables/core/interfaces'

class WidgetEventBusImpl implements WidgetEventBus {
  private emitter: EventEmitter<WidgetEvents>
  
  constructor() {
    this.emitter = createEventEmitter<WidgetEvents>()
  }
  
  emit<K extends keyof WidgetEvents>(event: K, ...args: WidgetEvents[K]): void {
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