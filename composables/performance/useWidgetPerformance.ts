import { usePerformanceOptimization } from './usePerformanceOptimization'
import type { WidgetInstance } from '~/types/widgets'

/**
 * Widget-specific performance optimizations
 */
export function useWidgetPerformance() {
  const { debounce, throttle, batchUpdate, useLazyLoad } = usePerformanceOptimization()
  
  /**
   * Optimize widget position updates (throttled)
   */
  const createOptimizedPositionUpdater = (
    updateFn: (id: number, row: number, col: number) => Promise<void>
  ) => {
    return throttle((id: number, row: number, col: number) => {
      batchUpdate(() => {
        updateFn(id, row, col)
      })
    }, 100) // Update at most every 100ms during drag
  }
  
  /**
   * Optimize widget resize updates (debounced)
   */
  const createOptimizedResizeUpdater = (
    updateFn: (id: number, rowSpan: number, colSpan: number) => Promise<void>
  ) => {
    return debounce((id: number, rowSpan: number, colSpan: number) => {
      updateFn(id, rowSpan, colSpan)
    }, 300) // Wait 300ms after resize stops
  }
  
  /**
   * Optimize widget config updates (debounced)
   */
  const createOptimizedConfigUpdater = (
    updateFn: (id: number, config: unknown) => Promise<void>
  ) => {
    return debounce((id: number, config: unknown) => {
      updateFn(id, config)
    }, 500) // Wait 500ms after config changes stop
  }
  
  /**
   * Widget visibility optimization using Intersection Observer
   */
  const useWidgetVisibility = (
    onVisible: (widgetId: number) => void,
    onHidden: (widgetId: number) => void
  ) => {
    const visibleWidgets = ref(new Set<number>())
    
    const { observe, unobserve } = useLazyLoad((entry) => {
      const widgetId = parseInt(entry.target.getAttribute('data-widget-id') || '0')
      
      if (entry.isIntersecting) {
        visibleWidgets.value.add(widgetId)
        onVisible(widgetId)
      } else {
        visibleWidgets.value.delete(widgetId)
        onHidden(widgetId)
      }
    }, {
      rootMargin: '50px', // Start loading 50px before visible
      threshold: 0.1 // Trigger when 10% visible
    })
    
    return {
      visibleWidgets: readonly(visibleWidgets),
      observeWidget: (element: Element, widgetId: number) => {
        element.setAttribute('data-widget-id', String(widgetId))
        observe(element)
      },
      unobserveWidget: unobserve
    }
  }
  
  /**
   * Optimize widget rendering with frame budget
   */
  const useFrameBudget = (targetFPS: number = 60) => {
    const frameTime = 1000 / targetFPS
    let lastFrameTime = 0
    
    const shouldSkipFrame = () => {
      const now = performance.now()
      if (now - lastFrameTime < frameTime) {
        return true
      }
      lastFrameTime = now
      return false
    }
    
    const measurePerformance = (operation: () => void, name: string) => {
      const start = performance.now()
      operation()
      const duration = performance.now() - start
      
      if (duration > frameTime) {
        console.warn(`[Performance] ${name} took ${duration.toFixed(2)}ms (target: ${frameTime.toFixed(2)}ms)`)
      }
      
      return duration
    }
    
    return {
      shouldSkipFrame,
      measurePerformance,
      frameTime
    }
  }
  
  /**
   * Widget render queue for progressive rendering
   */
  const useRenderQueue = () => {
    const queue = ref<Array<() => void>>([])
    const isProcessing = ref(false)
    
    const processQueue = async () => {
      if (isProcessing.value || queue.value.length === 0) return
      
      isProcessing.value = true
      const startTime = performance.now()
      const timeLimit = 16 // ~60fps frame budget
      
      while (queue.value.length > 0 && performance.now() - startTime < timeLimit) {
        const task = queue.value.shift()
        if (task) task()
      }
      
      isProcessing.value = false
      
      if (queue.value.length > 0) {
        requestAnimationFrame(processQueue)
      }
    }
    
    const enqueue = (task: () => void) => {
      queue.value.push(task)
      if (!isProcessing.value) {
        requestAnimationFrame(processQueue)
      }
    }
    
    const clear = () => {
      queue.value = []
    }
    
    return {
      enqueue,
      clear,
      queueSize: computed(() => queue.value.length)
    }
  }
  
  /**
   * Memory optimization for widget data
   */
  const useMemoryOptimization = () => {
    const weakCache = new WeakMap<WidgetInstance, any>()
    
    const cacheWidgetData = (widget: WidgetInstance, data: any) => {
      weakCache.set(widget, data)
    }
    
    const getCachedData = (widget: WidgetInstance) => {
      return weakCache.get(widget)
    }
    
    const clearUnusedMemory = () => {
      if (typeof gc !== 'undefined') {
        // Force garbage collection if available (requires --expose-gc flag)
        gc()
      }
    }
    
    return {
      cacheWidgetData,
      getCachedData,
      clearUnusedMemory
    }
  }
  
  return {
    createOptimizedPositionUpdater,
    createOptimizedResizeUpdater,
    createOptimizedConfigUpdater,
    useWidgetVisibility,
    useFrameBudget,
    useRenderQueue,
    useMemoryOptimization
  }
}