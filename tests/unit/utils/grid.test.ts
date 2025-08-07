import { describe, it, expect } from 'vitest'
import {
  getGridConfig,
  snapToGridWithMargins,
  type ContainerDimensions,
  type GridPosition
} from '@/lib/utils/grid'
import type { Page } from '@/types/page'

describe('Grid Utils', () => {
  describe('getGridConfig', () => {
    it('should return default grid config when page has no grid settings', () => {
      const page: Page = {
        id: 1,
        name: 'Test Page',
        dashboardId: 1,
        snapping: false,
        gridRows: null,
        gridCols: null,
        marginTop: 0,
        marginRight: 0,
        marginBottom: 0,
        marginLeft: 0
      }

      const config = getGridConfig(page)

      expect(config).toEqual({
        rows: 6,
        cols: 6,
        snapping: false
      })
    })

    it('should return custom grid config when page has grid settings', () => {
      const page: Page = {
        id: 1,
        name: 'Test Page',
        dashboardId: 1,
        snapping: true,
        gridRows: 8,
        gridCols: 12,
        marginTop: 20,
        marginRight: 20,
        marginBottom: 20,
        marginLeft: 20
      }

      const config = getGridConfig(page)

      expect(config).toEqual({
        rows: 8,
        cols: 12,
        snapping: true
      })
    })

    it('should handle falsy snapping values', () => {
      const page: Page = {
        id: 1,
        name: 'Test Page',
        dashboardId: 1,
        snapping: null,
        gridRows: 4,
        gridCols: 4,
        marginTop: 0,
        marginRight: 0,
        marginBottom: 0,
        marginLeft: 0
      }

      const config = getGridConfig(page)

      expect(config).toEqual({
        rows: 4,
        cols: 4,
        snapping: false
      })
    })
  })

  describe('snapToGridWithMargins', () => {
    const defaultPage: Page = {
      id: 1,
      name: 'Test Page',
      dashboardId: 1,
      snapping: false,
      gridRows: 6,
      gridCols: 6,
      marginTop: 20,
      marginRight: 20,
      marginBottom: 20,
      marginLeft: 20
    }

    it('should constrain position to margins when snapping is disabled', () => {
      const result = snapToGridWithMargins(
        10, 10, 100, 100, // x, y, width, height
        defaultPage,
        1200, 800 // container dimensions
      )

      expect(result.x).toBeGreaterThanOrEqual(20) // marginLeft
      expect(result.y).toBeGreaterThanOrEqual(20) // marginTop
      expect(result.x + result.w).toBeLessThanOrEqual(1200 - 20) // width - marginRight
      expect(result.y + result.h).toBeLessThanOrEqual(800 - 20) // height - marginBottom
    })

    it('should snap to grid when snapping is enabled', () => {
      const snappingPage: Page = {
        ...defaultPage,
        snapping: true
      }

      const result = snapToGridWithMargins(
        100, 100, 150, 150,
        snappingPage,
        1200, 800
      )

      // Available space: 1200-40 = 1160 width, 800-40 = 760 height
      // Grid cell size: width=193.33, height=126.67
      // Position should be snapped to grid
      const availableWidth = 1200 - 40 // container width minus margins
      const availableHeight = 800 - 40 // container height minus margins
      const cellWidth = availableWidth / 6 // 6 columns
      const cellHeight = availableHeight / 6 // 6 rows

      // The position should be a multiple of cell size plus margin offset
      expect((result.x - 20) % cellWidth).toBeCloseTo(0, 0.1)
      expect((result.y - 20) % cellHeight).toBeCloseTo(0, 0.1)
    })

    it('should handle edge case where widget is larger than available space', () => {
      const result = snapToGridWithMargins(
        100, 100, 2000, 1000, // Very large widget
        defaultPage,
        1200, 800
      )

      // Widget should be constrained to fit within margins
      expect(result.w).toBeLessThanOrEqual(1200 - 40) // width - both margins
      expect(result.h).toBeLessThanOrEqual(800 - 40) // height - both margins
    })

    it('should position widget within margins even when initial position is outside', () => {
      const result = snapToGridWithMargins(
        0, 0, 100, 100, // Position at top-left corner
        defaultPage,
        1200, 800
      )

      expect(result.x).toBe(20) // Should be moved to respect marginLeft
      expect(result.y).toBe(20) // Should be moved to respect marginTop
    })

    it('should handle zero margins', () => {
      const noMarginPage: Page = {
        ...defaultPage,
        marginTop: 0,
        marginRight: 0,
        marginBottom: 0,
        marginLeft: 0
      }

      const result = snapToGridWithMargins(
        50, 50, 100, 100,
        noMarginPage,
        1200, 800
      )

      expect(result.x).toBeGreaterThanOrEqual(0)
      expect(result.y).toBeGreaterThanOrEqual(0)
      expect(result.x + result.w).toBeLessThanOrEqual(1200)
      expect(result.y + result.h).toBeLessThanOrEqual(800)
    })

    it('should handle custom grid dimensions when snapping', () => {
      const customGridPage: Page = {
        ...defaultPage,
        snapping: true,
        gridRows: 4,
        gridCols: 8
      }

      const result = snapToGridWithMargins(
        100, 100, 150, 150,
        customGridPage,
        1200, 800
      )

      const availableWidth = 1200 - 40
      const availableHeight = 800 - 40
      const cellWidth = availableWidth / 8 // 8 columns
      const cellHeight = availableHeight / 4 // 4 rows

      expect((result.x - 20) % cellWidth).toBeCloseTo(0, 0.1)
      expect((result.y - 20) % cellHeight).toBeCloseTo(0, 0.1)
    })

    it('should ensure minimum widget size when snapping', () => {
      const snappingPage: Page = {
        ...defaultPage,
        snapping: true
      }

      const result = snapToGridWithMargins(
        100, 100, 10, 10, // Very small widget
        snappingPage,
        1200, 800
      )

      const availableWidth = 1200 - 40
      const availableHeight = 800 - 40
      const cellWidth = availableWidth / 6
      const cellHeight = availableHeight / 6

      // Widget should be at least one cell size
      expect(result.w).toBeGreaterThanOrEqual(cellWidth)
      expect(result.h).toBeGreaterThanOrEqual(cellHeight)
    })

    it('should handle position at the bottom-right edge', () => {
      const result = snapToGridWithMargins(
        1100, 700, 100, 100,
        defaultPage,
        1200, 800
      )

      // Widget should fit within margins
      expect(result.x + result.w).toBeLessThanOrEqual(1200 - 20) // respect marginRight
      expect(result.y + result.h).toBeLessThanOrEqual(800 - 20) // respect marginBottom
    })
  })
})