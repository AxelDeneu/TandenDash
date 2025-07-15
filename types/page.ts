// Page margins configuration
export interface PageMargins {
  marginTop: number
  marginRight: number
  marginBottom: number
  marginLeft: number
}

// Page from database
export interface Page extends PageMargins {
  id: number
  name: string
  snapping: boolean
  gridRows: number
  gridCols: number
  createdAt: string
  updatedAt: string
}

// API request/response types
export interface CreatePageRequest {
  name: string
  snapping?: boolean
  gridRows?: number
  gridCols?: number
  marginTop?: number
  marginRight?: number
  marginBottom?: number
  marginLeft?: number
}

export interface UpdatePageRequest {
  id: number
  name?: string
  snapping?: boolean
  gridRows?: number
  gridCols?: number
  marginTop?: number
  marginRight?: number
  marginBottom?: number
  marginLeft?: number
}

export interface DeletePageRequest {
  id: number
}

// Page with widgets (for frontend composition)
export interface PageWithWidgets extends Page {
  widgets: import('./widget').ParsedWidgetInstance[]
}

// Grid configuration
export interface GridConfig {
  rows: number
  cols: number
  cellWidth: number
  cellHeight: number
  gap: number
}

// Edit mode state
export interface EditModeState {
  isActive: boolean
  selectedWidgetId: number | null
  isDragging: boolean
  isResizing: boolean
}