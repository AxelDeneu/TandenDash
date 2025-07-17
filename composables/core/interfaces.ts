import type { Ref, ComputedRef } from 'vue'
import type { IServiceFactory } from '@/lib/services/interfaces'
import type { IWidgetCore } from '@/lib/widgets/interfaces'

// Base composable state
export interface BaseComposableState {
  loading: Ref<boolean>
  error: Ref<Error | null>
  initialized: Ref<boolean>
}

// Error handling
export interface ErrorHandler {
  error: Readonly<Ref<Error | null>>
  retryCount: Readonly<Ref<number>>
  isRetrying: Readonly<Ref<boolean>>
  maxRetries: Ref<number>
  canRetry: ComputedRef<boolean>
  hasError: ComputedRef<boolean>
  handleError(error: Error): void
  clearError(): void
  retry(): Promise<void>
}

// Loading state management
export interface LoadingState {
  isLoading: ComputedRef<boolean>
  setLoading(loading: boolean, key?: string): void
  withLoading<T>(operation: () => Promise<T>, key?: string): Promise<T>
  clearLoading(): void
  getLoadingKeys(): string[]
  isLoadingKey(key: string): boolean
}

// Data operations interface
export interface DataOperations<TData, TCreateData = TData, TUpdateData = Partial<TData>> {
  items: Ref<TData[]>
  loading: Ref<boolean>
  error: Ref<Error | null>
  
  fetch(): Promise<void>
  create(data: TCreateData): Promise<TData>
  update(id: string | number, data: TUpdateData): Promise<TData>
  remove(id: string | number): Promise<boolean>
  refresh(): Promise<void>
}

// UI state management
export interface UIState {
  selectedItems: Ref<Set<string | number>>
  searchQuery: Ref<string>
  sortBy: Ref<string>
  sortOrder: Ref<'asc' | 'desc'>
  filters: Ref<Record<string, unknown>>
  
  selectItem(id: string | number): void
  deselectItem(id: string | number): void
  toggleSelection(id: string | number): void
  clearSelection(): void
  selectAll(): void
  setSearch(query: string): void
  setSorting(field: string, order?: 'asc' | 'desc'): void
  setFilter(key: string, value: unknown): void
  clearFilters(): void
}

// Modal/Dialog management
export interface DialogState {
  isOpen: Ref<boolean>
  data: Ref<unknown>
  
  open(initialData?: unknown): void
  close(): void
  setData(data: unknown): void
}

// Event handling
export interface EventEmitter<TEvents extends Record<string, any[]> = Record<string, any[]>> {
  emit<K extends keyof TEvents>(event: K, ...args: TEvents[K]): void
  on<K extends keyof TEvents>(event: K, handler: (...args: TEvents[K]) => void): () => void
  off<K extends keyof TEvents>(event: K, handler: (...args: TEvents[K]) => void): void
  once<K extends keyof TEvents>(event: K, handler: (...args: TEvents[K]) => void): void
  emitAsync<K extends keyof TEvents>(event: K, ...args: TEvents[K]): Promise<void>
  removeAllListeners(event?: keyof TEvents): void
  listenerCount(event: keyof TEvents): number
  eventNames(): (keyof TEvents)[]
  wildcard(handler: (event: keyof TEvents, ...args: any[]) => void): () => void
  // Aliases
  addEventListener: EventEmitter<TEvents>['on']
  removeEventListener: EventEmitter<TEvents>['off']
  trigger: EventEmitter<TEvents>['emit']
  subscribe: EventEmitter<TEvents>['on']
  unsubscribe: EventEmitter<TEvents>['off']
  publish: EventEmitter<TEvents>['emit']
  dispatch: EventEmitter<TEvents>['emit']
  fire: EventEmitter<TEvents>['emit']
  addListener: EventEmitter<TEvents>['on']
  removeListener: EventEmitter<TEvents>['off']
}

// Dependency injection context
export interface ComposableContext {
  services: IServiceFactory
  widgets: IWidgetCore
  events: EventEmitter<import('./events').AppEvents>
}

// Composable factory interface
export interface ComposableFactory {
  createDataOperations<TData, TCreateData = TData, TUpdateData = Partial<TData>>(
    context: ComposableContext
  ): DataOperations<TData, TCreateData, TUpdateData>
  
  createUIState(): UIState
  createDialogState(): DialogState
  createErrorHandler(): ErrorHandler
  createLoadingState(): LoadingState
  createEventEmitter<TEvents = Record<string, unknown[]>>(): EventEmitter<TEvents>
}

// Specific composable interfaces
export interface UseTodoOperations {
  todoLists: Ref<import('@/types/todo').TodoListWithItems[]>
  loading: Ref<boolean>
  error: Ref<Error | null>
  
  fetchTodoLists(): Promise<void>
  createTodoList(data: import('@/types/todo').CreateTodoListRequest): Promise<import('@/types/todo').TodoList>
  updateTodoList(id: number, data: import('@/types/todo').UpdateTodoListRequest): Promise<import('@/types/todo').TodoList>
  deleteTodoList(id: number): Promise<boolean>
  
  createTodoItem(data: import('@/types/todo').CreateTodoItemRequest): Promise<import('@/types/todo').TodoItem>
  updateTodoItem(id: number, data: import('@/types/todo').UpdateTodoItemRequest): Promise<import('@/types/todo').TodoItem>
  deleteTodoItem(id: number): Promise<boolean>
  toggleTodoItem(id: number): Promise<import('@/types/todo').TodoItem>
}