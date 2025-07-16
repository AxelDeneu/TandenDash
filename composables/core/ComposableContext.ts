import { inject, provide, type InjectionKey } from 'vue'
import type { ComposableContext, EventEmitter } from './interfaces'
import type { IServiceFactory } from '@/lib/services/interfaces'
import type { IWidgetCore } from '@/lib/widgets/interfaces'
import { createEventEmitter } from '@/composables/core/EventEmitter'
import { createMockServiceFactory, createMockWidgetSystem } from './mockServices'
import { useLogger } from './useLogger'

// Injection keys
const COMPOSABLE_CONTEXT_KEY: InjectionKey<ComposableContext> = Symbol('composable-context')

// Default context implementation
class DefaultComposableContext implements ComposableContext {
  public readonly services: IServiceFactory
  public readonly widgets: IWidgetCore
  public readonly events: EventEmitter

  constructor() {
    // Always use mock services on client side to avoid database imports
    this.services = createMockServiceFactory()
    this.widgets = createMockWidgetSystem()
    
    // Create event emitter with logger if available
    try {
      const logger = useLogger({ module: 'ComposableContext' })
      this.events = createEventEmitter({ logger })
    } catch {
      // Fallback to event emitter without logger during SSR or when logger not available
      this.events = createEventEmitter()
    }
  }
}

let defaultContext: ComposableContext | null = null

// Context provider
export function provideComposableContext(context?: ComposableContext): ComposableContext {
  const ctx = context || getDefaultContext()
  provide(COMPOSABLE_CONTEXT_KEY, ctx)
  return ctx
}

// Context consumer
export function useComposableContext(): ComposableContext {
  const context = inject(COMPOSABLE_CONTEXT_KEY)
  if (!context) {
    // Fallback to default context if not provided
    return getDefaultContext()
  }
  return context
}

// Get or create default context
function getDefaultContext(): ComposableContext {
  if (!defaultContext) {
    defaultContext = new DefaultComposableContext()
  }
  return defaultContext
}

// Context factory for testing
export function createComposableContext(
  services?: IServiceFactory,
  widgets?: IWidgetCore,
  events?: EventEmitter
): ComposableContext {
  return {
    services: services || createMockServiceFactory(),
    widgets: widgets || createMockWidgetSystem(),
    events: events || createEventEmitter()
  }
}

// Initialize context
export async function initializeComposableContext(): Promise<void> {
  // Only initialize on the client side to avoid server/client hydration issues
  if (typeof window === 'undefined') {
    return
  }
  
  const context = getDefaultContext()
  
  // Initialize widget system if not already initialized
  if (!context.widgets.getSystemInfo().initialized) {
    await context.widgets.initialize()
  }
}

// Cleanup context
export function cleanupComposableContext(): void {
  if (defaultContext) {
    // Cleanup resources
    defaultContext = null
  }
}