import { getComputationCache } from '~/lib/cache/computation-cache'
import type { WidgetInstance } from '~/types/widgets'

/**
 * Composable for using computation cache in components
 */
export function useComputationCache() {
  const cache = getComputationCache()
  
  /**
   * Memoize expensive widget calculations
   */
  const memoizeWidgetCalculation = async <T>(
    widget: WidgetInstance,
    calculationName: string,
    calculator: () => Promise<T>,
    ttl?: number
  ): Promise<T> => {
    return cache.cacheWidgetCalculation(
      widget.id,
      calculationName,
      calculator,
      ttl
    )
  }
  
  /**
   * Calculate optimal grid layout with caching
   */
  const calculateOptimalLayout = async (
    pageId: number,
    widgets: WidgetInstance[],
    gridRows: number,
    gridCols: number
  ) => {
    return cache.cacheGridLayout(
      pageId,
      gridRows,
      gridCols,
      async () => {
        // Expensive layout calculation
        const layout = {
          positions: new Map<number, { row: number; col: number }>(),
          conflicts: [] as number[],
          gaps: [] as { row: number; col: number }[]
        }
        
        // Sort widgets by size (larger first)
        const sortedWidgets = [...widgets].sort((a, b) => {
          const sizeA = a.rowSpan * a.colSpan
          const sizeB = b.rowSpan * b.colSpan
          return sizeB - sizeA
        })
        
        // Grid occupancy matrix
        const grid: boolean[][] = Array(gridRows).fill(null).map(() => Array(gridCols).fill(false))
        
        // Mark occupied cells
        for (const widget of widgets) {
          for (let r = widget.row; r < Math.min(widget.row + widget.rowSpan, gridRows); r++) {
            for (let c = widget.col; c < Math.min(widget.col + widget.colSpan, gridCols); c++) {
              if (grid[r] && grid[r][c]) {
                layout.conflicts.push(widget.id)
              } else if (grid[r]) {
                grid[r][c] = true
              }
            }
          }
          layout.positions.set(widget.id, { row: widget.row, col: widget.col })
        }
        
        // Find gaps
        for (let r = 0; r < gridRows; r++) {
          for (let c = 0; c < gridCols; c++) {
            if (!grid[r][c]) {
              layout.gaps.push({ row: r, col: c })
            }
          }
        }
        
        return layout
      }
    )
  }
  
  /**
   * Calculate widget collision detection with caching
   */
  const detectCollisions = cache.memoize(
    async (widgets: WidgetInstance[]): Promise<Map<number, number[]>> => {
      const collisions = new Map<number, number[]>()
      
      for (let i = 0; i < widgets.length; i++) {
        const widget1 = widgets[i]
        const colliding: number[] = []
        
        for (let j = i + 1; j < widgets.length; j++) {
          const widget2 = widgets[j]
          
          // Check if widgets overlap
          const overlap = !(
            widget1.col + widget1.colSpan <= widget2.col ||
            widget2.col + widget2.colSpan <= widget1.col ||
            widget1.row + widget1.rowSpan <= widget2.row ||
            widget2.row + widget2.rowSpan <= widget1.row
          )
          
          if (overlap) {
            colliding.push(widget2.id)
            
            // Add reverse collision
            if (!collisions.has(widget2.id)) {
              collisions.set(widget2.id, [])
            }
            collisions.get(widget2.id)!.push(widget1.id)
          }
        }
        
        if (colliding.length > 0) {
          collisions.set(widget1.id, colliding)
        }
      }
      
      return collisions
    },
    {
      ttl: 60 * 1000, // 1 minute
      keyGenerator: (widgets) => widgets.map(w => `${w.id}:${w.row}:${w.col}:${w.rowSpan}:${w.colSpan}`).join(',')
    }
  )
  
  /**
   * Invalidate caches when needed
   */
  const invalidateWidgetCache = (widgetId: number) => {
    cache.invalidateWidgetCalculations(widgetId)
  }
  
  const invalidatePageCache = (pageId: number) => {
    cache.invalidatePageLayouts(pageId)
  }
  
  const getCacheStats = () => cache.getStats()
  
  return {
    memoizeWidgetCalculation,
    calculateOptimalLayout,
    detectCollisions,
    invalidateWidgetCache,
    invalidatePageCache,
    getCacheStats
  }
}