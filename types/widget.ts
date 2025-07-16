// Widget types for TandenDash
// For widget plugin system, see lib/widgets/interfaces.ts

// Base widget configuration interface
export interface BaseWidgetConfig {
  minWidth: number
  minHeight: number
}

// Widget position interface
export interface WidgetPosition {
  x: number
  y: number
  width: number
  height: number
}

// Database position representation (JSON string)
export interface WidgetPositionDB {
  left: string
  top: string
  width: string
  height: string
}

// Widget instance from database
export interface WidgetInstance {
  id: number
  type: string
  position: string // JSON string of WidgetPositionDB
  options: string // JSON string of widget-specific config
  pageId: number | null
  createdAt: string
  updatedAt: string
  // Runtime properties for drag/resize
  _dragPos?: { left: number; top: number }
  _resize?: { width: number; height: number }
}

// Parsed widget instance for frontend use - DEPRECATED: Use WidgetInstance instead
// This type is kept for compatibility but should be removed
export interface ParsedWidgetInstance<TConfig extends BaseWidgetConfig = BaseWidgetConfig> extends WidgetInstance {
  position: WidgetPosition // Override to parsed type
  options: TConfig // Override to parsed type
}

// Note: Widget definitions are now handled by the new WidgetPlugin system
// See lib/widgets/interfaces.ts for the new plugin architecture

// API request/response types
export interface CreateWidgetRequest {
  type: string
  position: WidgetPosition
  options: Record<string, unknown>
  pageId?: number
}

export interface UpdateWidgetRequest {
  id: number
  position?: WidgetPosition
  options?: Record<string, unknown>
  pageId?: number
}

export interface DeleteWidgetRequest {
  id: number
}

// Widget API response
export interface WidgetResponse {
  id: number
  type: string
  position: string
  options: string
  pageId: number | null
  createdAt: string
  updatedAt: string
}