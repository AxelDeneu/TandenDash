import type { Page, PageMargins } from '@/types/page'

export interface GridConfig {
  rows: number
  cols: number
  snapping: boolean
}

export interface ContainerDimensions {
  width: number
  height: number
}

export interface GridPosition {
  x: number
  y: number
  w: number
  h: number
}

/**
 * Get grid configuration from a page
 */
export function getGridConfig(page: Page): GridConfig {
  return {
    rows: page.gridRows || 6,
    cols: page.gridCols || 6,
    snapping: !!page.snapping
  }
}

/**
 * Snap position to grid based on page configuration
 */
export function snapToGrid(
  x: number,
  y: number,
  w: number,
  h: number,
  page: Page,
  containerWidth: number = window.innerWidth,
  containerHeight: number = window.innerHeight
): GridPosition {
  const grid = getGridConfig(page)
  
  if (!grid.snapping) {
    return { x, y, w, h }
  }
  
  const cellWidth = containerWidth / grid.cols
  const cellHeight = containerHeight / grid.rows
  
  return {
    x: Math.round(x / cellWidth) * cellWidth,
    y: Math.round(y / cellHeight) * cellHeight,
    w: Math.max(cellWidth, Math.round(w / cellWidth) * cellWidth),
    h: Math.max(cellHeight, Math.round(h / cellHeight) * cellHeight)
  }
}

/**
 * Get grid cell position from pixel coordinates
 */
export function pixelsToGridCell(
  x: number,
  y: number,
  page: Page,
  containerWidth: number = window.innerWidth,
  containerHeight: number = window.innerHeight
): { col: number; row: number } {
  const grid = getGridConfig(page)
  const cellWidth = containerWidth / grid.cols
  const cellHeight = containerHeight / grid.rows
  
  return {
    col: Math.floor(x / cellWidth),
    row: Math.floor(y / cellHeight)
  }
}

/**
 * Convert grid cell position to pixel coordinates
 */
export function gridCellToPixels(
  col: number,
  row: number,
  page: Page,
  containerWidth: number = window.innerWidth,
  containerHeight: number = window.innerHeight
): { x: number; y: number } {
  const grid = getGridConfig(page)
  const cellWidth = containerWidth / grid.cols
  const cellHeight = containerHeight / grid.rows
  
  return {
    x: col * cellWidth,
    y: row * cellHeight
  }
}

/**
 * Get available space after accounting for margins
 */
export function getAvailableSpace(
  page: Page,
  containerDimensions: ContainerDimensions
): {
  x: number
  y: number
  width: number
  height: number
} {
  return {
    x: page.marginLeft,
    y: page.marginTop,
    width: containerDimensions.width - page.marginLeft - page.marginRight,
    height: containerDimensions.height - page.marginTop - page.marginBottom
  }
}

/**
 * Constrain widget position to respect page margins
 */
export function constrainToMargins(
  x: number,
  y: number,
  width: number,
  height: number,
  page: Page,
  containerDimensions: ContainerDimensions
): GridPosition {
  const availableSpace = getAvailableSpace(page, containerDimensions)
  
  // Ensure widget fits within available space
  const constrainedWidth = Math.min(width, availableSpace.width)
  const constrainedHeight = Math.min(height, availableSpace.height)
  
  // Constrain position to keep widget within margins
  const minX = availableSpace.x
  const minY = availableSpace.y
  const maxX = availableSpace.x + availableSpace.width - constrainedWidth
  const maxY = availableSpace.y + availableSpace.height - constrainedHeight
  
  return {
    x: Math.max(minX, Math.min(maxX, x)),
    y: Math.max(minY, Math.min(maxY, y)),
    w: constrainedWidth,
    h: constrainedHeight
  }
}

/**
 * Snap position to grid with margin constraints
 */
export function snapToGridWithMargins(
  x: number,
  y: number,
  w: number,
  h: number,
  page: Page,
  containerWidth: number = window.innerWidth,
  containerHeight: number = window.innerHeight
): GridPosition {
  const containerDimensions = { width: containerWidth, height: containerHeight }
  
  // First constrain to margins
  const constrained = constrainToMargins(x, y, w, h, page, containerDimensions)
  
  // Then apply grid snapping if enabled
  if (page.snapping) {
    const availableSpace = getAvailableSpace(page, containerDimensions)
    const grid = getGridConfig(page)
    
    // Calculate cell size based on available space (after margins)
    const cellWidth = availableSpace.width / grid.cols
    const cellHeight = availableSpace.height / grid.rows
    
    // Snap to grid relative to the available space
    const relativeX = constrained.x - availableSpace.x
    const relativeY = constrained.y - availableSpace.y
    
    const snappedRelativeX = Math.round(relativeX / cellWidth) * cellWidth
    const snappedRelativeY = Math.round(relativeY / cellHeight) * cellHeight
    const snappedW = Math.max(cellWidth, Math.round(constrained.w / cellWidth) * cellWidth)
    const snappedH = Math.max(cellHeight, Math.round(constrained.h / cellHeight) * cellHeight)
    
    // Convert back to absolute coordinates
    const snappedX = availableSpace.x + snappedRelativeX
    const snappedY = availableSpace.y + snappedRelativeY
    
    // Final constraint check after snapping
    return constrainToMargins(snappedX, snappedY, snappedW, snappedH, page, containerDimensions)
  }
  
  return constrained
}