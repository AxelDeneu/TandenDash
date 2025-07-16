import { ref, computed, readonly, type Ref } from 'vue'
import type { WidgetInstance, CreateWidgetRequest, UpdateWidgetRequest } from '@/types/widget'
import { useComposableContext } from '../core/ComposableContext'
import { useErrorHandler } from '../core/useErrorHandler'
import { useLoadingState } from '../core/useLoadingState'
import { useWidgetEventBus } from '../events/useWidgetEventBus'

export interface UseWidgetOperations {
  widgets: Ref<WidgetInstance[]>
  loading: Ref<boolean>
  error: Ref<Error | null>
  
  fetchWidgets(pageId?: number): Promise<void>
  createWidget(data: CreateWidgetRequest): Promise<WidgetInstance>
  updateWidget(id: number, data: UpdateWidgetRequest): Promise<WidgetInstance>
  deleteWidget(id: number): Promise<boolean>
  findWidgetById(id: number): WidgetInstance | undefined
}

export function useWidgetOperations(): UseWidgetOperations {
  const context = useComposableContext()
  const widgets = ref<WidgetInstance[]>([])
  const eventBus = useWidgetEventBus()
  
  const loadingState = useLoadingState()
  const errorHandler = useErrorHandler(async () => {
    // Retry last failed operation
    if (lastOperation.value) {
      await lastOperation.value()
    }
  })

  const lastOperation = ref<(() => Promise<void>) | null>(null)

  const loading = computed(() => loadingState.isLoading.value)
  const error = computed(() => errorHandler.error.value)

  async function fetchWidgets(pageId?: number): Promise<void> {
    const operation = async () => {
      // Use API calls instead of direct service calls
      const url = pageId 
        ? `/api/widgets-instances?pageId=${pageId}` 
        : '/api/widgets-instances'
      const result = await $fetch(url, {
        // Force fresh fetch
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      const fetchedWidgets = Array.isArray(result) ? result : []
      
      if (pageId) {
        // Remove existing widgets for this page and add the new ones
        widgets.value = widgets.value.filter(w => w.pageId !== pageId)
        // Force Vue reactivity by creating new array
        widgets.value = [...widgets.value, ...fetchedWidgets]
      } else {
        // Fetch all widgets - replace the entire array
        // Force complete replacement to ensure reactivity
        widgets.value = [...fetchedWidgets]
      }
      
      context.events.emit('widgets:fetched', fetchedWidgets, pageId)
      
      // Emit global event bus events for each widget
      fetchedWidgets.forEach(widget => {
        eventBus.emit('widget:loading', widget.id, false)
      })
    }

    lastOperation.value = operation
    errorHandler.clearError()

    try {
      await loadingState.withLoading(operation, 'fetch-widgets')
    } catch (err) {
      errorHandler.handleError(err as Error)
      throw err
    }
  }

  async function createWidget(data: CreateWidgetRequest): Promise<WidgetInstance> {
    const operation = async () => {
      const newWidget = await $fetch('/api/widgets-instances', {
        method: 'POST',
        body: data
      })
      widgets.value.push(newWidget)
      
      context.events.emit('widget:created', newWidget)
      
      // Emit global event bus event
      eventBus.emit('widget:created', newWidget)
      
      return newWidget
    }

    errorHandler.clearError()

    try {
      return await loadingState.withLoading(operation, 'create-widget')
    } catch (err) {
      errorHandler.handleError(err as Error)
      throw err
    }
  }

  async function updateWidget(data: UpdateWidgetRequest): Promise<WidgetInstance> {
    const operation = async () => {
      const updatedWidget = await $fetch('/api/widgets-instances', {
        method: 'PUT',
        body: data
      })
      const index = widgets.value.findIndex(w => w.id === updatedWidget.id)
      if (index >= 0) {
        const oldWidget = widgets.value[index]
        widgets.value[index] = updatedWidget
        
        context.events.emit('widget:updated', updatedWidget)
        
        // Emit global event bus event
        eventBus.emit('widget:updated', updatedWidget, oldWidget)
        
        // Check for specific changes
        if (oldWidget.row !== updatedWidget.row || oldWidget.col !== updatedWidget.col) {
          eventBus.emit('widget:moved', updatedWidget.id, updatedWidget.row, updatedWidget.col)
        }
        if (oldWidget.rowSpan !== updatedWidget.rowSpan || oldWidget.colSpan !== updatedWidget.colSpan) {
          eventBus.emit('widget:resized', updatedWidget.id, updatedWidget.rowSpan, updatedWidget.colSpan)
        }
        if (JSON.stringify(oldWidget.config) !== JSON.stringify(updatedWidget.config)) {
          eventBus.emit('widget:config:changed', updatedWidget.id, updatedWidget.config, oldWidget.config)
        }
      }
      
      return updatedWidget
    }

    errorHandler.clearError()

    try {
      return await loadingState.withLoading(operation, 'update-widget')
    } catch (err) {
      errorHandler.handleError(err as Error)
      throw err
    }
  }

  async function deleteWidget(id: number): Promise<boolean> {
    const operation = async () => {
      await $fetch('/api/widgets-instances', {
        method: 'DELETE',
        body: { id }
      })
      
      const index = widgets.value.findIndex(w => w.id === id)
      if (index >= 0) {
        const deletedWidget = widgets.value[index]
        widgets.value.splice(index, 1)
        context.events.emit('widget:deleted', deletedWidget)
        
        // Emit global event bus event
        eventBus.emit('widget:deleted', id)
      }
      
      return true
    }

    errorHandler.clearError()

    try {
      return await loadingState.withLoading(operation, 'delete-widget')
    } catch (err) {
      errorHandler.handleError(err as Error)
      throw err
    }
  }

  function findWidgetById(id: number): WidgetInstance | undefined {
    return widgets.value.find(w => w.id === id)
  }

  // Subscribe to external widget changes
  context.events.on('widget:external-update', (updatedWidget: WidgetInstance) => {
    const index = widgets.value.findIndex(w => w.id === updatedWidget.id)
    if (index >= 0) {
      widgets.value[index] = updatedWidget
    }
  })

  context.events.on('widget:external-delete', (widgetId: number) => {
    const index = widgets.value.findIndex(w => w.id === widgetId)
    if (index >= 0) {
      widgets.value.splice(index, 1)
    }
  })

  return {
    widgets: readonly(widgets),
    loading,
    error,
    fetchWidgets,
    createWidget,
    updateWidget,
    deleteWidget,
    findWidgetById
  }
}