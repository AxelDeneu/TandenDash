// Re-export all types from specific modules
export type { BaseWidgetConfig, WidgetPosition, WidgetPositionDB, WidgetInstance, ParsedWidgetInstance, CreateWidgetRequest, UpdateWidgetRequest, DeleteWidgetRequest, WidgetResponse } from './widget'
export type { Page, CreatePageRequest, UpdatePageRequest, DeletePageRequest, PageWithWidgets, GridConfig, EditModeState } from './page'
export type { TodoItem, TodoList, TodoListWithItems, CreateTodoListRequest, UpdateTodoListRequest, DeleteTodoListRequest, CreateTodoItemRequest, UpdateTodoItemRequest, DeleteTodoItemRequest, BatchUpdateTodoItemsRequest, TodoListReference } from './todo'

// Legacy compatibility (deprecated - use specific types)
/** @deprecated Use Page from './page' */
export interface DashboardPage {
  widgets: any[]
}

/** @deprecated Use specific widget config types */
export interface DashboardConfig {
  pages: DashboardPage[]
  defaultPage: string
}

// Re-export widget configs for convenience
export type { WidgetConfig as ClockWidgetConfig } from '../widgets/Clock/definition'
export type { WidgetConfig as WeatherWidgetConfig } from '../widgets/Weather/definition' 