import { shallowRef, triggerRef, ref, computed, onUnmounted } from 'vue'
import type { Ref } from 'vue'
import type { WidgetInstance } from '~/types/widgets'

/**
 * Performance optimization composable
 * Provides utilities for optimizing rendering and updates
 */
export function usePerformanceOptimization() {
  /**
   * Use shallow ref for large widget arrays to prevent deep reactivity
   */
  const optimizeWidgetArray = <T extends WidgetInstance[]>(widgets: T) => {
    const optimizedWidgets = shallowRef(widgets)
    
    const updateWidgets = (updater: (widgets: T) => void) => {
      updater(optimizedWidgets.value)
      triggerRef(optimizedWidgets)
    }
    
    return {
      widgets: optimizedWidgets,
      updateWidgets
    }
  }
  
  /**
   * Batch DOM updates using requestAnimationFrame
   */
  const batchUpdate = (() => {
    let pending = false
    const callbacks: Array<() => void> = []
    
    const flush = () => {
      const toRun = [...callbacks]
      callbacks.length = 0
      pending = false
      toRun.forEach(cb => cb())
    }
    
    return (callback: () => void) => {
      callbacks.push(callback)
      if (!pending) {
        pending = true
        requestAnimationFrame(flush)
      }
    }
  })()
  
  /**
   * Debounce function for expensive operations
   */
  const debounce = <T extends (...args: unknown[]) => unknown>(
    fn: T,
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let timeoutId: NodeJS.Timeout | null = null
    
    return (...args: Parameters<T>) => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      
      timeoutId = setTimeout(() => {
        fn(...args)
        timeoutId = null
      }, delay)
    }
  }
  
  /**
   * Throttle function for rate-limiting operations
   */
  const throttle = <T extends (...args: unknown[]) => unknown>(
    fn: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle = false
    let lastArgs: Parameters<T> | null = null
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        fn(...args)
        inThrottle = true
        
        setTimeout(() => {
          inThrottle = false
          if (lastArgs) {
            fn(...lastArgs)
            lastArgs = null
          }
        }, limit)
      } else {
        lastArgs = args
      }
    }
  }
  
  /**
   * Virtual scrolling helper for large lists
   */
  const useVirtualScroll = <T>(
    items: Ref<T[]>,
    itemHeight: number,
    containerHeight: Ref<number>
  ) => {
    const scrollTop = ref(0)
    const startIndex = computed(() => Math.floor(scrollTop.value / itemHeight))
    const endIndex = computed(() => 
      Math.min(
        items.value.length,
        Math.ceil((scrollTop.value + containerHeight.value) / itemHeight)
      )
    )
    
    const visibleItems = computed(() => 
      items.value.slice(startIndex.value, endIndex.value)
    )
    
    const totalHeight = computed(() => items.value.length * itemHeight)
    const offsetY = computed(() => startIndex.value * itemHeight)
    
    return {
      visibleItems,
      totalHeight,
      offsetY,
      updateScrollTop: (value: number) => {
        scrollTop.value = value
      }
    }
  }
  
  /**
   * Intersection observer for lazy loading
   */
  const useLazyLoad = (
    callback: (entry: IntersectionObserverEntry) => void,
    options?: IntersectionObserverInit
  ) => {
    const observer = ref<IntersectionObserver | null>(null)
    const isSupported = typeof window !== 'undefined' && 'IntersectionObserver' in window
    
    const observe = (element: Element) => {
      if (!isSupported || !element) return
      
      if (!observer.value) {
        observer.value = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              callback(entry)
            }
          })
        }, options)
      }
      
      observer.value.observe(element)
    }
    
    const unobserve = (element: Element) => {
      if (observer.value && element) {
        observer.value.unobserve(element)
      }
    }
    
    const disconnect = () => {
      if (observer.value) {
        observer.value.disconnect()
        observer.value = null
      }
    }
    
    onUnmounted(disconnect)
    
    return {
      observe,
      unobserve,
      disconnect,
      isSupported
    }
  }
  
  /**
   * Optimize image loading
   */
  const optimizeImage = (src: string, options: {
    width?: number
    height?: number
    quality?: number
    format?: 'webp' | 'avif' | 'auto'
  } = {}) => {
    // If using an image optimization service
    const params = new URLSearchParams()
    
    if (options.width) params.append('w', String(options.width))
    if (options.height) params.append('h', String(options.height))
    if (options.quality) params.append('q', String(options.quality))
    if (options.format) params.append('f', options.format)
    
    return params.toString() ? `${src}?${params}` : src
  }
  
  return {
    optimizeWidgetArray,
    batchUpdate,
    debounce,
    throttle,
    useVirtualScroll,
    useLazyLoad,
    optimizeImage
  }
}