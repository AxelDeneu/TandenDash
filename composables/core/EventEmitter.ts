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

export function createEventEmitter<TEvents = Record<string, unknown[]>>(
  options: EventEmitterOptions<TEvents> = {}
): EventEmitter<TEvents> {
  const { validator, logger } = options
  type EventHandler<K extends keyof TEvents> = (...args: TEvents[K]) => void
  const listeners = new Map<keyof TEvents, Set<EventHandler<keyof TEvents>>>()

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
      args = validationResult.data
    }

    const eventListeners = listeners.get(event)
    if (eventListeners) {
      for (const handler of eventListeners) {
        try {
          handler(...args)
        } catch (error) {
          const errorMsg = `Error in event handler for '${String(event)}':`
          if (logger) {
            logger.error(errorMsg, error)
          } else {
            console.error(errorMsg, error)
          }
          // Emit error event for global error handling if available
          if (event !== 'error' && listeners.has('error' as keyof TEvents)) {
            const errorListeners = listeners.get('error' as keyof TEvents)
            if (errorListeners) {
              for (const errorHandler of errorListeners) {
                try {
                  errorHandler(error as any, event as any)
                } catch (errorHandlerError) {
                  if (logger) {
                    logger.error('Error in error handler:', errorHandlerError)
                  } else {
                    console.error('Error in error handler:', errorHandlerError)
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  function on<K extends keyof TEvents>(
    event: K, 
    handler: (...args: TEvents[K]) => void
  ): () => void {
    if (!listeners.has(event)) {
      listeners.set(event, new Set())
    }
    
    const eventListeners = listeners.get(event)!
    eventListeners.add(handler as EventHandler<keyof TEvents>)
    
    // Return unsubscribe function
    return () => {
      eventListeners.delete(handler as EventHandler<keyof TEvents>)
      if (eventListeners.size === 0) {
        listeners.delete(event)
      }
    }
  }

  function off<K extends keyof TEvents>(
    event: K, 
    handler: (...args: TEvents[K]) => void
  ): void {
    const eventListeners = listeners.get(event)
    if (eventListeners) {
      eventListeners.delete(handler as EventHandler<keyof TEvents>)
      if (eventListeners.size === 0) {
        listeners.delete(event)
      }
    }
  }

  function once<K extends keyof TEvents>(
    event: K, 
    handler: (...args: TEvents[K]) => void
  ): void {
    const onceHandler = (...args: TEvents[K]) => {
      handler(...args)
      off(event, onceHandler)
    }
    on(event, onceHandler)
  }

  // Additional utility methods
  function removeAllListeners<K extends keyof TEvents>(event?: K): void {
    if (event) {
      listeners.delete(event)
    } else {
      listeners.clear()
    }
  }

  function listenerCount<K extends keyof TEvents>(event: K): number {
    const eventListeners = listeners.get(event)
    return eventListeners ? eventListeners.size : 0
  }

  function eventNames(): (keyof TEvents)[] {
    return Array.from(listeners.keys())
  }

  return {
    emit,
    on,
    off,
    once,
    removeAllListeners,
    listenerCount,
    eventNames
  } as EventEmitter<TEvents> & {
    removeAllListeners<K extends keyof TEvents>(event?: K): void
    listenerCount<K extends keyof TEvents>(event: K): number
    eventNames(): (keyof TEvents)[]
  }
}