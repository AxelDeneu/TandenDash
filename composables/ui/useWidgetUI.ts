import { ref, computed, readonly, type Ref, type ComputedRef } from 'vue'
import type { WidgetInstance } from '@/types/widget'
import { useComposableContext } from '../core/ComposableContext'

export interface UseWidgetUI {
  selectedWidgets: Ref<Set<number>>
  dragState: Ref<{
    isDragging: boolean
    draggedWidget: WidgetInstance | null
    startPosition: { x: number; y: number } | null
  }>
  resizeState: Ref<{
    isResizing: boolean
    resizedWidget: WidgetInstance | null
    startSize: { width: number; height: number } | null
  }>
  hasSelection: ComputedRef<boolean>
  selectionCount: ComputedRef<number>
  isDragging: ComputedRef<boolean>
  isResizing: ComputedRef<boolean>
  isInteracting: ComputedRef<boolean>
  
  selectWidget(id: number): void
  deselectWidget(id: number): void
  clearSelection(): void
  isSelected(id: number): boolean
  startDrag(widget: WidgetInstance, position: { x: number; y: number }): void
  updateDrag(position: { x: number; y: number }): void
  endDrag(): void
  cancelDrag(): void
  startResize(widget: WidgetInstance, size: { width: number; height: number }): void
  updateResize(size: { width: number; height: number }): void
  endResize(): void
  cancelResize(): void
}

export function useWidgetUI(): UseWidgetUI {
  const context = useComposableContext()
  const selectedWidgets = ref(new Set<number>())
  
  const dragState = ref({
    isDragging: false,
    draggedWidget: null as WidgetInstance | null,
    startPosition: null as { x: number; y: number } | null
  })
  
  const resizeState = ref({
    isResizing: false,
    resizedWidget: null as WidgetInstance | null,
    startSize: null as { width: number; height: number } | null
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


  function isSelected(id: number): boolean {
    return selectedWidgets.value.has(id)
  }

  // Drag operations
  function startDrag(widget: WidgetInstance, position: { x: number; y: number }): void {
    if (dragState.value.isDragging) return

    dragState.value = {
      isDragging: true,
      draggedWidget: widget,
      startPosition: { ...position }
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

    const offset = {
      x: position.x - dragState.value.startPosition.x,
      y: position.y - dragState.value.startPosition.y
    }

    context.events.emit('widget:drag-update', dragState.value.draggedWidget, position, offset)
  }

  function endDrag(): void {
    if (!dragState.value.isDragging) return

    const draggedWidget = dragState.value.draggedWidget

    // Reset drag state
    dragState.value = {
      isDragging: false,
      draggedWidget: null,
      startPosition: null
    }

    context.events.emit('widget:drag-end', draggedWidget, null, null)
    
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
      startPosition: null
    }

    context.events.emit('widget:drag-cancelled', draggedWidget)
    
    if (typeof document !== 'undefined') {
      document.body.classList.remove('widget-dragging')
    }
  }

  // Resize operations
  function startResize(widget: WidgetInstance, size: { width: number; height: number }): void {
    if (resizeState.value.isResizing) return

    resizeState.value = {
      isResizing: true,
      resizedWidget: widget,
      startSize: { ...size }
    }

    // Auto-select resized widget
    if (!isSelected(widget.id)) {
      selectWidget(widget.id)
    }

    context.events.emit('widget:resize-start', widget, size)
    
    // Add global resize class
    if (typeof document !== 'undefined') {
      document.body.classList.add('widget-resizing')
    }
  }

  function updateResize(size: { width: number; height: number }): void {
    if (!resizeState.value.isResizing) return

    context.events.emit('widget:resize-update', resizeState.value.resizedWidget, size)
  }

  function endResize(): void {
    if (!resizeState.value.isResizing) return

    const resizedWidget = resizeState.value.resizedWidget

    // Reset resize state
    resizeState.value = {
      isResizing: false,
      resizedWidget: null,
      startSize: null
    }

    context.events.emit('widget:resize-end', resizedWidget, null)
    
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
      startSize: null
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
    clearSelection,
    isSelected,
    startDrag,
    updateDrag,
    endDrag,
    cancelDrag,
    startResize,
    updateResize,
    endResize,
    cancelResize
  }
}