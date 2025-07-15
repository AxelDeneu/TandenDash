import { inject, provide, type InjectionKey } from 'vue'
import type { ComposableContext, EventEmitter } from './interfaces'
import type { IServiceFactory } from '@/lib/services/interfaces'
import type { IWidgetSystem } from '@/lib/widgets/interfaces'
import { createEventEmitter } from './EventEmitter'

// Injection keys
const COMPOSABLE_CONTEXT_KEY: InjectionKey<ComposableContext> = Symbol('composable-context')

// Default context implementation
class DefaultComposableContext implements ComposableContext {
  public readonly services: IServiceFactory
  public readonly widgets: IWidgetSystem
  public readonly events: EventEmitter

  constructor() {
    // Always use mock services on client side to avoid database imports
    this.services = createMockServiceFactory()
    this.widgets = createMockWidgetSystem()
    this.events = createEventEmitter()
  }
}

// Mock service factory for client-side to avoid database initialization
function createMockServiceFactory(): IServiceFactory {
  return {
    createWidgetService: () => ({
      async findAll() { return [] },
      async findById() { return null },
      async findByPageId() { return [] },
      async findByType() { return [] },
      async create() { throw new Error('Client-side service calls not supported') },
      async update() { throw new Error('Client-side service calls not supported') },
      async delete() { throw new Error('Client-side service calls not supported') },
      async bulkCreate() { throw new Error('Client-side service calls not supported') },
      async validateConfig() { return { isValid: true, errors: [] } },
      async getPositionConflicts() { return [] }
    }),
    createPageService: () => ({
      async findAll() { return [] },
      async findById() { return null },
      async create() { throw new Error('Client-side service calls not supported') },
      async update() { throw new Error('Client-side service calls not supported') },
      async delete() { throw new Error('Client-side service calls not supported') },
      async getDefaultGridSettings() { return { rows: 6, cols: 6, snapping: true } }
    }),
    createTodoService: () => ({
      async findAllLists() { return [] },
      async findListById() { return null },
      async createList() { throw new Error('Client-side service calls not supported') },
      async updateList() { throw new Error('Client-side service calls not supported') },
      async deleteList() { throw new Error('Client-side service calls not supported') },
      async findItemsByListId() { return [] },
      async findItemById() { return null },
      async createItem() { throw new Error('Client-side service calls not supported') },
      async updateItem() { throw new Error('Client-side service calls not supported') },
      async deleteItem() { throw new Error('Client-side service calls not supported') },
      async batchUpdateItems() { throw new Error('Client-side service calls not supported') }
    }),
    createModeService: () => ({
      async getCurrentMode() { return 'light' },
      async setMode() { throw new Error('Client-side service calls not supported') },
      async toggleMode() { throw new Error('Client-side service calls not supported') }
    })
  } as IServiceFactory
}

// Mock widget system for client-side
function createMockWidgetSystem(): IWidgetSystem {
  return {
    async initialize() {},
    getSystemInfo() { 
      return { 
        initialized: true, 
        version: '1.0.0', 
        pluginCount: 0, 
        instanceCount: 0 
      } 
    },
    async enableHotReload() {},
    async disableHotReload() {},
    async shutdown() {},
    registry: {} as any,
    instanceManager: {} as any,
    factory: {} as any,
    errorBoundary: {} as any,
    loader: {} as any
  } as IWidgetSystem
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
  widgets?: IWidgetSystem,
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