import { ref, onMounted, onUnmounted, type Ref } from 'vue'
import { useWidgetUI, useFloatingDock, useComposableContext } from '@/composables'
import { snapToGridWithMargins } from '~/lib/utils/grid'
import type { WidgetInstance, WidgetPosition, Page } from '@/types'
export interface DragDropState {
  widgetId: number
  offsetX: number
  offsetY: number
}

export interface ResizeDropState {
  widgetId: number
  startX: number
  startY: number
  startWidth: number
  startHeight: number
}

export interface UseDragAndDrop {
  tempPositions: Ref<Record<number, WidgetPosition>>
  dragState: Ref<DragDropState | null>
  resizeState: Ref<ResizeDropState | null>
  
  handleDragStart(e: MouseEvent | TouchEvent, widget: WidgetInstance, page: Page, position: WidgetPosition): void
  handleResizeStart(e: MouseEvent | TouchEvent, widget: WidgetInstance, page: Page, position: WidgetPosition): void
  setupEventListeners(dashboardContainer: Ref<HTMLElement | null>, currentPage: Ref<Page | null>): () => void
}

export function useDragAndDrop(
  onPositionUpdate: (widgetId: number, position: WidgetPosition) => Promise<void>
): UseDragAndDrop {
  const widgetUI = useWidgetUI()
  const floatingDock = useFloatingDock()
  const context = useComposableContext()
  
  // Local state for drag/drop calculations
  const tempPositions = ref<Record<number, WidgetPosition>>({})
  const dragState = ref<DragDropState | null>(null)
  const resizeState = ref<ResizeDropState | null>(null)
  
  // Extract client coordinates from mouse or touch event
  function getClientCoordinates(e: MouseEvent | TouchEvent): { clientX: number; clientY: number } {
    if ('touches' in e && e.touches.length > 0) {
      return {
        clientX: e.touches[0].clientX,
        clientY: e.touches[0].clientY
      }
    }
    return {
      clientX: (e as MouseEvent).clientX,
      clientY: (e as MouseEvent).clientY
    }
  }
  
  // Apply snapping and margin constraints to position
  function applySnapping(
    position: WidgetPosition, 
    currentPage: Page | null,
    dashboardContainer: HTMLElement | null
  ): WidgetPosition {
    if (!currentPage || !dashboardContainer) {
      return position
    }
    
    const containerRect = dashboardContainer.getBoundingClientRect()
    const snapped = snapToGridWithMargins(
      position.x,
      position.y,
      position.width,
      position.height,
      currentPage,
      containerRect.width,
      containerRect.height
    )
    
    return {
      x: snapped.x,
      y: snapped.y,
      width: snapped.w,
      height: snapped.h
    }
  }
  
  // Handle drag start
  function handleDragStart(
    e: MouseEvent | TouchEvent, 
    widget: WidgetInstance, 
    page: Page,
    position: WidgetPosition
  ): void {
    e.stopPropagation()
    const { clientX, clientY } = getClientCoordinates(e)
    
    dragState.value = {
      widgetId: widget.id,
      offsetX: clientX - position.x,
      offsetY: clientY - position.y
    }
    
    tempPositions.value[widget.id] = { ...position }
    widgetUI.startDrag(widget, { x: clientX, y: clientY })
    
    // Update dock interaction time when starting drag
    floatingDock.updateInteractionTime()
  }
  
  // Handle resize start
  function handleResizeStart(
    e: MouseEvent | TouchEvent,
    widget: WidgetInstance,
    page: Page,
    position: WidgetPosition
  ): void {
    e.stopPropagation()
    const { clientX, clientY } = getClientCoordinates(e)
    
    resizeState.value = {
      widgetId: widget.id,
      startX: clientX,
      startY: clientY,
      startWidth: position.width,
      startHeight: position.height
    }
    
    tempPositions.value[widget.id] = { ...position }
    widgetUI.startResize(widget, { width: position.width, height: position.height })
    
    // Update dock interaction time when starting resize
    floatingDock.updateInteractionTime()
  }
  
  // Setup event listeners with unified mouse/touch handling
  function setupEventListeners(
    dashboardContainer: Ref<HTMLElement | null>,
    currentPage: Ref<Page | null>
  ): () => void {
    // Unified pointer move handler
    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!dragState.value && !resizeState.value) return
      
      const { clientX, clientY } = getClientCoordinates(e)
      
      if (dragState.value) {
        const { widgetId, offsetX, offsetY } = dragState.value
        const newX = clientX - offsetX
        const newY = clientY - offsetY
        
        if (tempPositions.value[widgetId]) {
          const newPosition = {
            ...tempPositions.value[widgetId],
            x: newX,
            y: newY
          }
          
          // Apply snapping for drag operations
          tempPositions.value[widgetId] = applySnapping(
            newPosition, 
            currentPage.value,
            dashboardContainer.value
          )
        }
        
        widgetUI.updateDrag({ x: clientX, y: clientY })
        
        // Update dock interaction time during drag
        floatingDock.updateInteractionTime()
      } else if (resizeState.value) {
        const { widgetId, startX, startY, startWidth, startHeight } = resizeState.value
        const deltaX = clientX - startX
        const deltaY = clientY - startY
        
        const newWidth = Math.max(300, startWidth + deltaX)
        const newHeight = Math.max(200, startHeight + deltaY)
        
        if (tempPositions.value[widgetId]) {
          const newPosition = {
            ...tempPositions.value[widgetId],
            width: newWidth,
            height: newHeight
          }
          
          // Apply snapping for resize operations
          tempPositions.value[widgetId] = applySnapping(
            newPosition,
            currentPage.value,
            dashboardContainer.value
          )
        }
        
        widgetUI.updateResize({ width: newWidth, height: newHeight })
        
        // Update dock interaction time during resize
        floatingDock.updateInteractionTime()
      }
    }
    
    // Unified pointer end handler
    const handlePointerEnd = async () => {
      if (dragState.value) {
        const { widgetId } = dragState.value
        const finalPosition = tempPositions.value[widgetId]
        
        if (finalPosition) {
          await onPositionUpdate(widgetId, finalPosition)
        }
        
        delete tempPositions.value[widgetId]
        dragState.value = null
        widgetUI.endDrag()
      } else if (resizeState.value) {
        const { widgetId } = resizeState.value
        const finalPosition = tempPositions.value[widgetId]
        
        if (finalPosition) {
          await onPositionUpdate(widgetId, finalPosition)
        }
        
        delete tempPositions.value[widgetId]
        resizeState.value = null
        widgetUI.endResize()
      }
    }
    
    // Touch-specific handlers
    const handleTouchMove = (e: TouchEvent) => {
      if (dragState.value || resizeState.value) {
        e.preventDefault() // Prevent scrolling during drag/resize
      }
      handlePointerMove(e)
    }
    
    // Add event listeners
    window.addEventListener('mousemove', handlePointerMove)
    window.addEventListener('mouseup', handlePointerEnd)
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handlePointerEnd)
    
    // Return cleanup function
    return () => {
      window.removeEventListener('mousemove', handlePointerMove)
      window.removeEventListener('mouseup', handlePointerEnd)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handlePointerEnd)
    }
  }
  
  return {
    tempPositions,
    dragState,
    resizeState,
    handleDragStart,
    handleResizeStart,
    setupEventListeners
  }
}