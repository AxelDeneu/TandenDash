import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref, nextTick } from 'vue'
import { useDragAndDrop } from '@/composables/interaction/useDragAndDrop'
import type { WidgetInstance, WidgetPosition, Page } from '@/types'

// Mock dependencies
vi.mock('@/composables', () => ({
  useWidgetUI: () => ({
    startDrag: vi.fn(),
    updateDrag: vi.fn(),
    endDrag: vi.fn(),
    startResize: vi.fn(),
    updateResize: vi.fn(),
    endResize: vi.fn()
  }),
  useFloatingDock: () => ({
    updateInteractionTime: vi.fn()
  }),
  useComposableContext: () => ({
    events: {
      emit: vi.fn(),
      on: vi.fn(),
      off: vi.fn()
    }
  })
}))

vi.mock('~/lib/utils/grid', () => ({
  snapToGridWithMargins: vi.fn((x, y, w, h) => ({ x, y, w, h }))
}))

const mockWidget: WidgetInstance = {
  id: 1,
  type: 'test',
  pageId: 1,
  position: { x: 100, y: 100, width: 200, height: 150 },
  options: {}
}

const mockPage: Page = {
  id: 1,
  name: 'Test Page',
  dashboardId: 1,
  snapping: true,
  gridRows: 12,
  gridCols: 12,
  marginTop: 10,
  marginRight: 10,
  marginBottom: 10,
  marginLeft: 10
}

const mockPosition: WidgetPosition = {
  x: 100,
  y: 100,
  width: 200,
  height: 150
}

// Mock DOM methods
const mockBoundingRect = {
  width: 1200,
  height: 800,
  top: 0,
  left: 0,
  right: 1200,
  bottom: 800,
  x: 0,
  y: 0,
  toJSON: vi.fn()
}

Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
  value: vi.fn(() => mockBoundingRect)
})

describe('useDragAndDrop Composable', () => {
  let mockOnPositionUpdate: ReturnType<typeof vi.fn>
  let mockDashboardContainer: any
  let mockCurrentPage: any
  
  beforeEach(() => {
    vi.clearAllMocks()
    mockOnPositionUpdate = vi.fn().mockResolvedValue(undefined)
    
    mockDashboardContainer = ref({
      getBoundingClientRect: vi.fn(() => mockBoundingRect)
    })
    mockCurrentPage = ref(mockPage)
  })

  describe('initialization', () => {
    it('should initialize with empty state', () => {
      const dragDrop = useDragAndDrop(mockOnPositionUpdate)

      expect(dragDrop.tempPositions.value).toEqual({})
      expect(dragDrop.dragState.value).toBeNull()
      expect(dragDrop.resizeState.value).toBeNull()
    })

    it('should provide all required methods', () => {
      const dragDrop = useDragAndDrop(mockOnPositionUpdate)

      expect(typeof dragDrop.handleDragStart).toBe('function')
      expect(typeof dragDrop.handleResizeStart).toBe('function')
      expect(typeof dragDrop.setupEventListeners).toBe('function')
    })
  })

  describe('handleDragStart', () => {
    it('should start drag with mouse event', () => {
      const dragDrop = useDragAndDrop(mockOnPositionUpdate)
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: 150,
        clientY: 125
      })

      dragDrop.handleDragStart(mouseEvent, mockWidget, mockPage, mockPosition)

      expect(dragDrop.dragState.value).toEqual({
        widgetId: 1,
        offsetX: 50, // clientX (150) - position.x (100)
        offsetY: 25  // clientY (125) - position.y (100)
      })
      expect(dragDrop.tempPositions.value[1]).toEqual(mockPosition)
    })

    it('should start drag with touch event', () => {
      const dragDrop = useDragAndDrop(mockOnPositionUpdate)
      const touchEvent = new TouchEvent('touchstart', {
        touches: [
          {
            clientX: 150,
            clientY: 125
          } as Touch
        ] as TouchList
      })

      dragDrop.handleDragStart(touchEvent, mockWidget, mockPage, mockPosition)

      expect(dragDrop.dragState.value).toEqual({
        widgetId: 1,
        offsetX: 50,
        offsetY: 25
      })
    })

    it('should prevent event propagation', () => {
      const dragDrop = useDragAndDrop(mockOnPositionUpdate)
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: 150,
        clientY: 125
      })
      const stopPropagationSpy = vi.spyOn(mouseEvent, 'stopPropagation')

      dragDrop.handleDragStart(mouseEvent, mockWidget, mockPage, mockPosition)

      expect(stopPropagationSpy).toHaveBeenCalled()
    })
  })

  describe('handleResizeStart', () => {
    it('should start resize with mouse event', () => {
      const dragDrop = useDragAndDrop(mockOnPositionUpdate)
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: 300,
        clientY: 250
      })

      dragDrop.handleResizeStart(mouseEvent, mockWidget, mockPage, mockPosition)

      expect(dragDrop.resizeState.value).toEqual({
        widgetId: 1,
        startX: 300,
        startY: 250,
        startWidth: 200,
        startHeight: 150
      })
      expect(dragDrop.tempPositions.value[1]).toEqual(mockPosition)
    })

    it('should start resize with touch event', () => {
      const dragDrop = useDragAndDrop(mockOnPositionUpdate)
      const touchEvent = new TouchEvent('touchstart', {
        touches: [
          {
            clientX: 300,
            clientY: 250
          } as Touch
        ] as TouchList
      })

      dragDrop.handleResizeStart(touchEvent, mockWidget, mockPage, mockPosition)

      expect(dragDrop.resizeState.value).toEqual({
        widgetId: 1,
        startX: 300,
        startY: 250,
        startWidth: 200,
        startHeight: 150
      })
    })
  })

  describe('setupEventListeners', () => {
    let cleanup: () => void
    let addEventListenerSpy: ReturnType<typeof vi.spyOn>
    let removeEventListenerSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      addEventListenerSpy = vi.spyOn(window, 'addEventListener')
      removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
    })

    afterEach(() => {
      if (cleanup) {
        cleanup()
      }
    })

    it('should add event listeners', () => {
      const dragDrop = useDragAndDrop(mockOnPositionUpdate)

      cleanup = dragDrop.setupEventListeners(mockDashboardContainer, mockCurrentPage)

      expect(addEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function))
      expect(addEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function))
      expect(addEventListenerSpy).toHaveBeenCalledWith('touchmove', expect.any(Function), { passive: false })
      expect(addEventListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function))
    })

    it('should remove event listeners when cleanup is called', () => {
      const dragDrop = useDragAndDrop(mockOnPositionUpdate)

      cleanup = dragDrop.setupEventListeners(mockDashboardContainer, mockCurrentPage)
      cleanup()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchmove', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function))
    })
  })

  describe('drag operations', () => {
    it('should handle drag movement', async () => {
      const dragDrop = useDragAndDrop(mockOnPositionUpdate)
      
      // Setup event listeners
      cleanup = dragDrop.setupEventListeners(mockDashboardContainer, mockCurrentPage)
      
      // Start drag
      const startEvent = new MouseEvent('mousedown', { clientX: 150, clientY: 125 })
      dragDrop.handleDragStart(startEvent, mockWidget, mockPage, mockPosition)
      
      // Simulate drag movement
      const moveEvent = new MouseEvent('mousemove', { clientX: 200, clientY: 175 })
      window.dispatchEvent(moveEvent)
      
      await nextTick()
      
      // Position should be updated based on movement
      const expectedPosition = {
        ...mockPosition,
        x: 150, // 200 - 50 (offset)
        y: 150  // 175 - 25 (offset)
      }
      expect(dragDrop.tempPositions.value[1]).toMatchObject(expectedPosition)
    })

    it('should complete drag on mouse up', async () => {
      const dragDrop = useDragAndDrop(mockOnPositionUpdate)
      
      cleanup = dragDrop.setupEventListeners(mockDashboardContainer, mockCurrentPage)
      
      // Start and move drag
      dragDrop.handleDragStart(
        new MouseEvent('mousedown', { clientX: 150, clientY: 125 }), 
        mockWidget, 
        mockPage, 
        mockPosition
      )
      
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 175 }))
      await nextTick()
      
      // End drag
      window.dispatchEvent(new MouseEvent('mouseup'))
      await nextTick()
      
      expect(mockOnPositionUpdate).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          x: expect.any(Number),
          y: expect.any(Number)
        })
      )
      expect(dragDrop.dragState.value).toBeNull()
      expect(dragDrop.tempPositions.value[1]).toBeUndefined()
    })
  })

  describe('resize operations', () => {
    it('should handle resize movement', async () => {
      const dragDrop = useDragAndDrop(mockOnPositionUpdate)
      
      cleanup = dragDrop.setupEventListeners(mockDashboardContainer, mockCurrentPage)
      
      // Start resize
      const startEvent = new MouseEvent('mousedown', { clientX: 300, clientY: 250 })
      dragDrop.handleResizeStart(startEvent, mockWidget, mockPage, mockPosition)
      
      // Simulate resize movement
      const moveEvent = new MouseEvent('mousemove', { clientX: 350, clientY: 300 })
      window.dispatchEvent(moveEvent)
      
      await nextTick()
      
      // Size should be updated based on movement
      const expectedPosition = {
        ...mockPosition,
        width: 250,  // 200 + 50 (delta)
        height: 200  // 150 + 50 (delta)
      }
      expect(dragDrop.tempPositions.value[1]).toMatchObject(expectedPosition)
    })

    it('should enforce minimum size constraints', async () => {
      const dragDrop = useDragAndDrop(mockOnPositionUpdate)
      
      cleanup = dragDrop.setupEventListeners(mockDashboardContainer, mockCurrentPage)
      
      // Start resize
      dragDrop.handleResizeStart(
        new MouseEvent('mousedown', { clientX: 300, clientY: 250 }), 
        mockWidget, 
        mockPage, 
        mockPosition
      )
      
      // Try to resize to very small size
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 100 }))
      await nextTick()
      
      // Should enforce minimum constraints
      expect(dragDrop.tempPositions.value[1].width).toBeGreaterThanOrEqual(300)
      expect(dragDrop.tempPositions.value[1].height).toBeGreaterThanOrEqual(200)
    })

    it('should complete resize on mouse up', async () => {
      const dragDrop = useDragAndDrop(mockOnPositionUpdate)
      
      cleanup = dragDrop.setupEventListeners(mockDashboardContainer, mockCurrentPage)
      
      // Start resize
      dragDrop.handleResizeStart(
        new MouseEvent('mousedown', { clientX: 300, clientY: 250 }), 
        mockWidget, 
        mockPage, 
        mockPosition
      )
      
      // Move and end resize
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 350, clientY: 300 }))
      await nextTick()
      
      window.dispatchEvent(new MouseEvent('mouseup'))
      await nextTick()
      
      expect(mockOnPositionUpdate).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          width: expect.any(Number),
          height: expect.any(Number)
        })
      )
      expect(dragDrop.resizeState.value).toBeNull()
      expect(dragDrop.tempPositions.value[1]).toBeUndefined()
    })
  })

  describe('touch events', () => {
    it('should prevent default on touch move during drag', async () => {
      const dragDrop = useDragAndDrop(mockOnPositionUpdate)
      
      cleanup = dragDrop.setupEventListeners(mockDashboardContainer, mockCurrentPage)
      
      // Start drag
      dragDrop.handleDragStart(
        new TouchEvent('touchstart', {
          touches: [{ clientX: 150, clientY: 125 } as Touch] as TouchList
        }), 
        mockWidget, 
        mockPage, 
        mockPosition
      )
      
      // Create touch move event with preventDefault spy
      const touchMoveEvent = new TouchEvent('touchmove', {
        touches: [{ clientX: 200, clientY: 175 } as Touch] as TouchList
      })
      const preventDefaultSpy = vi.spyOn(touchMoveEvent, 'preventDefault')
      
      window.dispatchEvent(touchMoveEvent)
      
      expect(preventDefaultSpy).toHaveBeenCalled()
    })

    it('should handle touch end events', async () => {
      const dragDrop = useDragAndDrop(mockOnPositionUpdate)
      
      cleanup = dragDrop.setupEventListeners(mockDashboardContainer, mockCurrentPage)
      
      // Start drag with touch
      dragDrop.handleDragStart(
        new TouchEvent('touchstart', {
          touches: [{ clientX: 150, clientY: 125 } as Touch] as TouchList
        }), 
        mockWidget, 
        mockPage, 
        mockPosition
      )
      
      // End with touch end
      window.dispatchEvent(new TouchEvent('touchend'))
      await nextTick()
      
      expect(dragDrop.dragState.value).toBeNull()
    })
  })

  describe('edge cases', () => {
    it('should handle mouse move without active drag or resize', () => {
      const dragDrop = useDragAndDrop(mockOnPositionUpdate)
      
      cleanup = dragDrop.setupEventListeners(mockDashboardContainer, mockCurrentPage)
      
      // Move without drag/resize - should not crash
      expect(() => {
        window.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 200 }))
      }).not.toThrow()
    })

    it('should handle missing temp position during drag', async () => {
      const dragDrop = useDragAndDrop(mockOnPositionUpdate)
      
      cleanup = dragDrop.setupEventListeners(mockDashboardContainer, mockCurrentPage)
      
      // Manually set drag state without temp position
      dragDrop.dragState.value = {
        widgetId: 999,
        offsetX: 50,
        offsetY: 25
      }
      
      // Should not crash on move
      expect(() => {
        window.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 200 }))
      }).not.toThrow()
    })

    it('should handle null container and page for snapping', () => {
      const dragDrop = useDragAndDrop(mockOnPositionUpdate)
      
      const nullContainer = ref(null)
      const nullPage = ref(null)
      cleanup = dragDrop.setupEventListeners(nullContainer, nullPage)
      
      // Start and move drag - should not crash
      dragDrop.handleDragStart(
        new MouseEvent('mousedown', { clientX: 150, clientY: 125 }), 
        mockWidget, 
        mockPage, 
        mockPosition
      )
      
      expect(() => {
        window.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 200 }))
      }).not.toThrow()
    })
  })
})