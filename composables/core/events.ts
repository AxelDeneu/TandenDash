import type { Page } from '@/types/page'
import type { WidgetInstance } from '@/types/widget'
import type { TodoListWithItems, TodoItem } from '@/types/todo'

export interface AppEvents {
  // Page events
  'pages:fetched': [pages: Page[]]
  'page:fetched': [page: Page]
  'page:created': [page: Page]
  'page:updated': [page: Page]
  'page:deleted': [pageId: number]
  'page:external-update': [page: Page]
  'page:external-delete': [pageId: number]
  
  // Widget events
  'widgets:fetched': [widgets: WidgetInstance[]]
  'widget:created': [widget: WidgetInstance]
  'widget:updated': [widget: WidgetInstance]
  'widget:deleted': [widget: WidgetInstance]
  'widget:add-completed': [pageId: number]
  'widget:delete-completed': [widgetId: number, pageId: number]
  'widget:edit-completed': [pageId: number]
  'widget:external-update': [widget: WidgetInstance]
  'widget:external-delete': [widgetId: number]
  
  // Todo events
  'todos:fetched': [todos: TodoListWithItems[]]
  'todo:created': [todo: TodoListWithItems]
  'todo:updated': [todo: TodoListWithItems]
  'todo:deleted': [todoId: number]
  'todoItem:created': [item: TodoItem]
  'todoItem:updated': [item: TodoItem]
  'todoItem:deleted': [itemId: number]
  
  // UI events
  'editMode:changed': [enabled: boolean]
  'darkMode:changed': [isDark: boolean]
  'dialog:opened': [dialogId: string]
  'dialog:closed': [dialogId: string]
  'edit-mode:enabled': []
  'edit-mode:disabled': []
  'page:add-dialog-opened': []
  'page:add-dialog-closed': []
  'page:current-changed': [page: Page | null]
  'page:rename-dialog-opened': [page: Page]
  'page:rename-dialog-closed': []
  'widget:add-dialog-opened': [pageId: number]
  'widget:add-dialog-closed': []
  'widget:edit-dialog-opened': [widget: WidgetInstance, pageId: number]
  'widget:edit-dialog-closed': []
  
  // Error events
  'error:occurred': [error: Error]
  'error:cleared': []
}