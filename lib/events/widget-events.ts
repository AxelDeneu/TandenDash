import type { WidgetInstance } from '@/types'

export interface WidgetEvents {
  // Widget lifecycle events
  'widget:created': [widget: WidgetInstance]
  'widget:updated': [widget: WidgetInstance, oldWidget: WidgetInstance]
  'widget:deleted': [widgetId: number]
  'widget:moved': [widgetId: number, newRow: number, newCol: number]
  'widget:resized': [widgetId: number, newRowSpan: number, newColSpan: number]
  
  // Widget state events
  'widget:error': [widgetId: number, error: Error]
  'widget:loading': [widgetId: number, isLoading: boolean]
  'widget:data:updated': [widgetId: number, data: unknown]
  'widget:config:changed': [widgetId: number, newConfig: unknown, oldConfig: unknown]
  
  // Widget interaction events
  'widget:selected': [widgetId: number]
  'widget:deselected': [widgetId: number]
  'widget:focused': [widgetId: number]
  'widget:blurred': [widgetId: number]
  
  // Page events
  'page:changed': [pageId: number]
  'page:created': [pageId: number]
  'page:deleted': [pageId: number]
  'page:updated': [pageId: number]
  
  // Edit mode events
  'editMode:changed': [isEditMode: boolean]
  'editMode:dragStart': [widgetId: number]
  'editMode:dragEnd': [widgetId: number]
  'editMode:resizeStart': [widgetId: number]
  'editMode:resizeEnd': [widgetId: number]
  
  // Theme events
  'theme:changed': [isDark: boolean]
  
  // Grid events
  'grid:snappingChanged': [isSnapping: boolean]
  'grid:sizeChanged': [rows: number, cols: number]
}

export interface WidgetEventBus {
  emit<K extends keyof WidgetEvents>(event: K, ...args: WidgetEvents[K]): void
  on<K extends keyof WidgetEvents>(event: K, handler: (...args: WidgetEvents[K]) => void): () => void
  off<K extends keyof WidgetEvents>(event: K, handler: (...args: WidgetEvents[K]) => void): void
  once<K extends keyof WidgetEvents>(event: K, handler: (...args: WidgetEvents[K]) => void): void
}