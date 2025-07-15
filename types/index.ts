// Re-export all types from specific modules
export type { BaseWidgetConfig, WidgetPosition, WidgetPositionDB, WidgetInstance, ParsedWidgetInstance, WidgetDefinition, WidgetRegistry, CreateWidgetRequest, UpdateWidgetRequest, DeleteWidgetRequest, WidgetResponse } from './widget'
export type { Page, CreatePageRequest, UpdatePageRequest, DeletePageRequest, PageWithWidgets, GridConfig, EditModeState } from './page'
export type { TodoItem, TodoList, TodoListWithItems, CreateTodoListRequest, UpdateTodoListRequest, DeleteTodoListRequest, CreateTodoItemRequest, UpdateTodoItemRequest, DeleteTodoItemRequest, BatchUpdateTodoItemsRequest, TodoListReference } from './todo'

// Legacy compatibility (deprecated - use specific types)
/** @deprecated Use Page from './page' */
export interface DashboardPage extends Page {
  widgets: ParsedWidgetInstance[]
}

/** @deprecated Use specific widget config types */
export interface DashboardConfig {
  pages: DashboardPage[]
  defaultPage: string
}

// Re-export widget configs for convenience
export type { ClockWidgetConfig } from '../components/widgets/Clock/definition'
export type { WeatherWidgetConfig } from '../components/widgets/Weather/definition' 