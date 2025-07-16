import type { 
  WidgetInstance, 
  ParsedWidgetInstance,
  CreateWidgetRequest, 
  UpdateWidgetRequest 
} from '@/types/widget'
import type { 
  Page, 
  PageWithWidgets,
  CreatePageRequest, 
  UpdatePageRequest 
} from '@/types/page'
import type { 
  TodoList, 
  TodoItem, 
  TodoListWithItems,
  CreateTodoListRequest,
  UpdateTodoListRequest,
  CreateTodoItemRequest,
  UpdateTodoItemRequest,
  BatchUpdateTodoItemsRequest
} from '@/types/todo'

// Service result types for better error handling
export interface ServiceResult<T> {
  success: boolean
  data?: T
  error?: string
}

export interface ServiceListResult<T> {
  success: boolean
  data?: T[]
  error?: string
  total?: number
}

// Logger types
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogContext {
  module?: string
  method?: string
  userId?: number
  widgetId?: number
  pageId?: number
  [key: string]: unknown
}

export interface LogEntry {
  timestamp: Date
  level: LogLevel
  message: string
  data?: unknown
  context?: LogContext
}

// Logger service interface
export interface ILoggerService {
  debug(message: string, data?: unknown, context?: LogContext): void
  info(message: string, data?: unknown, context?: LogContext): void
  warn(message: string, data?: unknown, context?: LogContext): void
  error(message: string, error?: Error | unknown, context?: LogContext): void
  setLogLevel(level: LogLevel): void
  getLogLevel(): LogLevel
  getHistory(level?: LogLevel, limit?: number): LogEntry[]
  clearHistory(): void
  time(label: string, context?: LogContext): () => void
  logApiRequest(method: string, url: string, data?: unknown): void
  logApiResponse(method: string, url: string, status: number, data?: unknown): void
  logWidgetEvent(widgetId: number, event: string, data?: unknown): void
  devLog(message: string, data?: unknown): void
}

// Widget service interface
export interface IWidgetService {
  getAllWidgets(pageId?: number): Promise<ServiceListResult<WidgetInstance>>
  getWidgetById(id: number): Promise<ServiceResult<WidgetInstance>>
  createWidget(data: CreateWidgetRequest): Promise<ServiceResult<WidgetInstance>>
  updateWidget(id: number, data: UpdateWidgetRequest): Promise<ServiceResult<WidgetInstance>>
  deleteWidget(id: number): Promise<ServiceResult<boolean>>
  getWidgetsByType(type: string): Promise<ServiceListResult<WidgetInstance>>
  bulkUpdateWidgets(widgets: Array<{ id: number; position?: string; options?: string }>): Promise<ServiceListResult<WidgetInstance>>
  parseWidgetInstance(widget: WidgetInstance): ParsedWidgetInstance
}

// Page service interface
export interface IPageService {
  getAllPages(): Promise<ServiceListResult<Page>>
  getPageById(id: number): Promise<ServiceResult<Page>>
  getPageWithWidgets(id: number): Promise<ServiceResult<PageWithWidgets>>
  createPage(data: CreatePageRequest): Promise<ServiceResult<Page>>
  updatePage(id: number, data: UpdatePageRequest): Promise<ServiceResult<Page>>
  deletePage(id: number): Promise<ServiceResult<boolean>>
  updateGridSettings(id: number, gridRows: number, gridCols: number, snapping: boolean): Promise<ServiceResult<Page>>
  validatePageName(name: string, excludeId?: number): Promise<ServiceResult<boolean>>
}

// Todo service interfaces
export interface ITodoListService {
  getAllTodoLists(): Promise<ServiceListResult<TodoListWithItems>>
  getTodoListById(id: number): Promise<ServiceResult<TodoListWithItems>>
  createTodoList(data: CreateTodoListRequest): Promise<ServiceResult<TodoList>>
  updateTodoList(id: number, data: UpdateTodoListRequest): Promise<ServiceResult<TodoList>>
  deleteTodoList(id: number): Promise<ServiceResult<boolean>>
}

export interface ITodoItemService {
  getTodoItemsByListId(listId: number): Promise<ServiceListResult<TodoItem>>
  getTodoItemById(id: number): Promise<ServiceResult<TodoItem>>
  createTodoItem(data: CreateTodoItemRequest): Promise<ServiceResult<TodoItem>>
  updateTodoItem(id: number, data: UpdateTodoItemRequest): Promise<ServiceResult<TodoItem>>
  deleteTodoItem(id: number): Promise<ServiceResult<boolean>>
  batchUpdateTodoItems(updates: BatchUpdateTodoItemsRequest): Promise<ServiceListResult<TodoItem>>
  reorderTodoItems(items: Array<{ id: number; position: number }>): Promise<ServiceListResult<TodoItem>>
  toggleTodoItemComplete(id: number): Promise<ServiceResult<TodoItem>>
}

// Mode service interface
export interface IModeService {
  getCurrentMode(): Promise<ServiceResult<'light' | 'dark'>>
  setMode(mode: 'light' | 'dark'): Promise<ServiceResult<void>>
  toggleMode(): Promise<ServiceResult<'light' | 'dark'>>
}

// Service factory interface
export interface IServiceFactory {
  createWidgetService(): IWidgetService
  createPageService(): IPageService
  createTodoListService(): ITodoListService
  createTodoItemService(): ITodoItemService
  createModeService(): IModeService
  createLoggerService(): ILoggerService
}