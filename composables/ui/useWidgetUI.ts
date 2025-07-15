import { ref, computed, readonly } from 'vue'
import type { UseWidgetUI } from '../core/interfaces'
import type { WidgetInstance } from '@/types/widget'
import { useComposableContext } from '../core/ComposableContext'

export function useWidgetUI(): UseWidgetUI {
  const context = useComposableContext()
  const selectedWidgets = ref(new Set<number>())
  
  const dragState = ref({
    isDragging: false,
    draggedWidget: null as WidgetInstance | null,
    startPosition: null as { x: number; y: number } | null,
    currentPosition: null as { x: number; y: number } | null,
    offset: null as { x: number; y: number } | null
  })
  
  const resizeState = ref({
    isResizing: false,
    resizedWidget: null as WidgetInstance | null,
    startSize: null as { width: number; height: number } | null,
    currentSize: null as { width: number; height: number } | null,
    resizeHandle: null as string | null
  })

  // Selection methods
  function selectWidget(id: number): void {
    selectedWidgets.value.add(id)
    context.events.emit('widget:selected', id)
  }

  function deselectWidget(id: number): void {
    selectedWidgets.value.delete(id)
    context.events.emit('widget:deselected', id)
  }

  function toggleSelection(id: number): void {
    if (selectedWidgets.value.has(id)) {
      deselectWidget(id)
    } else {
      selectWidget(id)
    }
  }

  function clearSelection(): void {
    const previousSelection = Array.from(selectedWidgets.value)
    selectedWidgets.value.clear()
    context.events.emit('widget:selection-cleared', previousSelection)
  }

  function selectMultiple(ids: number[]): void {
    clearSelection()
    ids.forEach(id => selectWidget(id))
  }

  function isSelected(id: number): boolean {
    return selectedWidgets.value.has(id)
  }

  // Drag operations
  function startDrag(widget: WidgetInstance, position: { x: number; y: number }): void {
    if (dragState.value.isDragging) return

    dragState.value = {
      isDragging: true,
      draggedWidget: widget,
      startPosition: { ...position },
      currentPosition: { ...position },
      offset: { x: 0, y: 0 }
    }

    // Auto-select dragged widget
    if (!isSelected(widget.id)) {
      selectWidget(widget.id)
    }

    context.events.emit('widget:drag-start', widget, position)
    
    // Add global drag class
    if (typeof document !== 'undefined') {
      document.body.classList.add('widget-dragging')
    }
  }

  function updateDrag(position: { x: number; y: number }): void {
    if (!dragState.value.isDragging || !dragState.value.startPosition) return

    dragState.value.currentPosition = { ...position }
    dragState.value.offset = {
      x: position.x - dragState.value.startPosition.x,
      y: position.y - dragState.value.startPosition.y
    }

    context.events.emit('widget:drag-update', dragState.value.draggedWidget, position, dragState.value.offset)
  }

  function endDrag(): void {
    if (!dragState.value.isDragging) return

    const draggedWidget = dragState.value.draggedWidget
    const finalPosition = dragState.value.currentPosition
    const offset = dragState.value.offset

    // Reset drag state
    dragState.value = {
      isDragging: false,
      draggedWidget: null,
      startPosition: null,
      currentPosition: null,
      offset: null
    }

    context.events.emit('widget:drag-end', draggedWidget, finalPosition, offset)
    
    // Remove global drag class
    if (typeof document !== 'undefined') {
      document.body.classList.remove('widget-dragging')
    }
  }

  function cancelDrag(): void {
    if (!dragState.value.isDragging) return

    const draggedWidget = dragState.value.draggedWidget
    
    dragState.value = {
      isDragging: false,
      draggedWidget: null,
      startPosition: null,
      currentPosition: null,
      offset: null
    }

    context.events.emit('widget:drag-cancelled', draggedWidget)
    
    if (typeof document !== 'undefined') {
      document.body.classList.remove('widget-dragging')
    }
  }

  // Resize operations
  function startResize(widget: WidgetInstance, size: { width: number; height: number }, handle = 'se'): void {
    if (resizeState.value.isResizing) return

    resizeState.value = {
      isResizing: true,
      resizedWidget: widget,
      startSize: { ...size },
      currentSize: { ...size },
      resizeHandle: handle
    }

    // Auto-select resized widget
    if (!isSelected(widget.id)) {
      selectWidget(widget.id)
    }

    context.events.emit('widget:resize-start', widget, size, handle)
    
    // Add global resize class
    if (typeof document !== 'undefined') {
      document.body.classList.add('widget-resizing')
    }
  }

  function updateResize(size: { width: number; height: number }): void {
    if (!resizeState.value.isResizing) return

    resizeState.value.currentSize = { ...size }
    context.events.emit('widget:resize-update', resizeState.value.resizedWidget, size)
  }

  function endResize(): void {
    if (!resizeState.value.isResizing) return

    const resizedWidget = resizeState.value.resizedWidget
    const finalSize = resizeState.value.currentSize

    // Reset resize state
    resizeState.value = {
      isResizing: false,
      resizedWidget: null,
      startSize: null,
      currentSize: null,
      resizeHandle: null
    }

    context.events.emit('widget:resize-end', resizedWidget, finalSize)
    
    // Remove global resize class
    if (typeof document !== 'undefined') {
      document.body.classList.remove('widget-resizing')
    }
  }

  function cancelResize(): void {
    if (!resizeState.value.isResizing) return

    const resizedWidget = resizeState.value.resizedWidget
    
    resizeState.value = {
      isResizing: false,
      resizedWidget: null,
      startSize: null,
      currentSize: null,
      resizeHandle: null
    }

    context.events.emit('widget:resize-cancelled', resizedWidget)
    
    if (typeof document !== 'undefined') {
      document.body.classList.remove('widget-resizing')
    }
  }

  // Computed properties
  const hasSelection = computed(() => selectedWidgets.value.size > 0)
  const selectionCount = computed(() => selectedWidgets.value.size)
  const isDragging = computed(() => dragState.value.isDragging)
  const isResizing = computed(() => resizeState.value.isResizing)
  const isInteracting = computed(() => isDragging.value || isResizing.value)

  // Keyboard shortcuts for widget operations
  function setupKeyboardShortcuts(): () => void {
    if (typeof document === 'undefined') return () => {}

    function handleKeydown(event: KeyboardEvent): void {
      // Delete selected widgets with Delete key
      if (event.key === 'Delete' && hasSelection.value) {
        event.preventDefault()
        const selectedIds = Array.from(selectedWidgets.value)
        context.events.emit('widget:delete-selected', selectedIds)
      }
      
      // Select all widgets with Ctrl/Cmd + A
      if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
        event.preventDefault()
        context.events.emit('widget:select-all')
      }
      
      // Cancel current operation with Escape
      if (event.key === 'Escape') {
        if (isDragging.value) {
          cancelDrag()
        } else if (isResizing.value) {
          cancelResize()
        } else if (hasSelection.value) {
          clearSelection()
        }
      }
    }

    document.addEventListener('keydown', handleKeydown)
    return () => document.removeEventListener('keydown', handleKeydown)
  }

  return {
    selectedWidgets: readonly(selectedWidgets),
    dragState: readonly(dragState),
    resizeState: readonly(resizeState),
    hasSelection,
    selectionCount,
    isDragging,
    isResizing,
    isInteracting,
    selectWidget,
    deselectWidget,
    toggleSelection,
    clearSelection,
    selectMultiple,
    isSelected,
    startDrag,
    updateDrag,
    endDrag,
    cancelDrag,
    startResize,
    updateResize,
    endResize,
    cancelResize,
    setupKeyboardShortcuts
  }
}