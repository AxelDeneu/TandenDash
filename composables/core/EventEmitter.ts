import type { EventEmitter } from './interfaces'

type EventValidator<TEvents> = <K extends keyof TEvents>(
  event: K,
  args: TEvents[K]
) => { success: true; data: TEvents[K] } | { success: false; error: string }

export interface EventEmitterOptions<TEvents> {
  validator?: EventValidator<TEvents>
  logger?: {
    error: (message: string, ...args: any[]) => void
    warn: (message: string, ...args: any[]) => void
  }
}

export function createEventEmitter<TEvents extends Record<string, any[]> = Record<string, any[]>>(
  options: EventEmitterOptions<TEvents> = {}
): EventEmitter<TEvents> {
  const { validator, logger } = options
  type EventHandler<K extends keyof TEvents> = (...args: TEvents[K]) => void
  type AnyEventHandler = (...args: any[]) => void
  const listeners = new Map<keyof TEvents, Set<AnyEventHandler>>()

  function emit<K extends keyof TEvents>(event: K, ...args: TEvents[K]): void {
    // Validate event payload if validator is provided
    if (validator) {
      const validationResult = validator(event, args)
      if (!validationResult.success) {
        const errorMsg = `Event validation failed for '${String(event)}': ${validationResult.error}`
        if (logger) {
          logger.error(errorMsg)
          if (process.env.NODE_ENV === 'development') {
            logger.warn('Event payload:', args)
          }
        } else {
          console.error(errorMsg)
          if (process.env.NODE_ENV === 'development') {
            console.warn('Event payload:', args)
          }
        }
        return // Don't emit invalid events
      }
      // Use validated data
      args = validationResult.data as TEvents[K]
    }

    const eventListeners = listeners.get(event)
    if (eventListeners) {
      for (const handler of eventListeners) {
        try {
          handler(...args)
        } catch (error) {
          const errorMsg = `Handler error for event '${String(event)}':`
          if (logger) {
            logger.error(errorMsg, error)
          } else {
            console.error(errorMsg, error)
          }
        }
      }
    }
  }

  function emitAsync<K extends keyof TEvents>(event: K, ...args: TEvents[K]): Promise<void> {
    return new Promise((resolve) => {
      emit(event, ...args)
      resolve()
    })
  }

  function wildcard(handler: (event: keyof TEvents, ...args: any[]) => void): () => void {
    // Store a special handler that listens to all events
    const wildcardHandler = (event: keyof TEvents) => (...args: any[]) => {
      handler(event, ...args)
    }
    
    // Add wildcard handler to all existing events
    for (const event of listeners.keys()) {
      on(event, wildcardHandler(event))
    }
    
    // TODO: Handle new events that are added after wildcard is registered
    // This would require modifying the 'on' method to check for wildcard handlers
    
    return () => {
      // Remove wildcard handler from all events
      for (const event of listeners.keys()) {
        off(event, wildcardHandler(event))
      }
    }
  }

  function on<K extends keyof TEvents>(
    event: K, 
    handler: EventHandler<K>
  ): () => void {
    if (!listeners.has(event)) {
      listeners.set(event, new Set())
    }
    
    const eventListeners = listeners.get(event)!
    eventListeners.add(handler as AnyEventHandler)
    
    // Return unsubscribe function
    return () => {
      eventListeners.delete(handler as AnyEventHandler)
      if (eventListeners.size === 0) {
        listeners.delete(event)
      }
    }
  }

  function off<K extends keyof TEvents>(
    event: K, 
    handler: EventHandler<K>
  ): void {
    const eventListeners = listeners.get(event)
    if (eventListeners) {
      eventListeners.delete(handler as AnyEventHandler)
      if (eventListeners.size === 0) {
        listeners.delete(event)
      }
    }
  }

  function once<K extends keyof TEvents>(
    event: K, 
    handler: EventHandler<K>
  ): void {
    const onceHandler: EventHandler<K> = (...args) => {
      handler(...args)
      off(event, onceHandler)
    }
    on(event, onceHandler)
  }

  function removeAllListeners(event?: keyof TEvents): void {
    if (event) {
      listeners.delete(event)
    } else {
      listeners.clear()
    }
  }

  function listenerCount(event: keyof TEvents): number {
    const eventListeners = listeners.get(event)
    return eventListeners ? eventListeners.size : 0
  }

  function eventNames(): (keyof TEvents)[] {
    return Array.from(listeners.keys())
  }

  return {
    emit,
    emitAsync,
    on,
    off,
    once,
    removeAllListeners,
    listenerCount,
    eventNames,
    // Aliases
    addEventListener: on,
    removeEventListener: off,
    trigger: emit,
    subscribe: on,
    unsubscribe: off,
    publish: emit,
    dispatch: emit,
    fire: emit,
    addListener: on,
    removeListener: off,
    wildcard
  }
}