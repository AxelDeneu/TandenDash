export default defineNuxtPlugin(() => {
  // Only run on client side
  if (process.server) return
  
  // Enable passive event listeners for better scroll performance
  const addPassiveEventListener = () => {
    const originalAddEventListener = EventTarget.prototype.addEventListener
    
    EventTarget.prototype.addEventListener = function(type, listener, options) {
      if (typeof options === 'object' && options !== null) {
        // Already has options
      } else if (typeof options === 'boolean') {
        options = { capture: options }
      } else {
        options = {}
      }
      
      // Make touch and wheel events passive by default
      if (['touchstart', 'touchmove', 'wheel', 'mousewheel'].includes(type)) {
        options.passive = options.passive !== false
      }
      
      originalAddEventListener.call(this, type, listener, options)
    }
  }
  
  // Optimize animations using will-change
  const optimizeAnimations = () => {
    // Add will-change to elements that will be animated
    const style = document.createElement('style')
    style.textContent = `
      .widget-container {
        will-change: transform;
      }
      
      .widget-container.dragging {
        will-change: transform, left, top;
      }
      
      .widget-container.resizing {
        will-change: width, height;
      }
      
      .page-transition {
        will-change: opacity, transform;
      }
      
      /* Remove will-change after animation */
      .widget-container:not(.dragging):not(.resizing):not(.animating) {
        will-change: auto;
      }
    `
    document.head.appendChild(style)
  }
  
  // Reduce reflow/repaint by batching style changes
  const batchStyleChanges = () => {
    const pendingStyles = new Map<Element, Map<string, string>>()
    let rafId: number | null = null
    
    const applyStyles = () => {
      pendingStyles.forEach((styles, element) => {
        styles.forEach((value, property) => {
          (element as HTMLElement).style.setProperty(property, value)
        })
      })
      pendingStyles.clear()
      rafId = null
    }
    
    window.batchStyle = (element: Element, property: string, value: string) => {
      if (!pendingStyles.has(element)) {
        pendingStyles.set(element, new Map())
      }
      pendingStyles.get(element)!.set(property, value)
      
      if (!rafId) {
        rafId = requestAnimationFrame(applyStyles)
      }
    }
  }
  
  // Optimize image loading
  const optimizeImages = () => {
    // Use native lazy loading
    const images = document.querySelectorAll('img:not([loading])')
    images.forEach(img => {
      img.setAttribute('loading', 'lazy')
    })
    
    // Add decoding async
    const largeImages = document.querySelectorAll('img[width="300"], img[height="300"]')
    largeImages.forEach(img => {
      img.setAttribute('decoding', 'async')
    })
  }
  
  // Performance monitoring
  const setupPerformanceMonitoring = () => {
    if (!window.performance || !window.performance.mark) return
    
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              console.warn('[Performance] Long task detected:', {
                duration: `${entry.duration.toFixed(2)}ms`,
                startTime: `${entry.startTime.toFixed(2)}ms`
              })
            }
          }
        })
        observer.observe({ entryTypes: ['longtask'] })
      } catch (e) {
        // Long task monitoring not supported
      }
    }
    
    // Monitor layout shifts
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          let cls = 0
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              cls += (entry as any).value
            }
          }
          if (cls > 0.1) {
            console.warn('[Performance] Layout shift detected:', cls)
          }
        })
        observer.observe({ entryTypes: ['layout-shift'] })
      } catch (e) {
        // Layout shift monitoring not supported
      }
    }
  }
  
  // Prefetch critical resources
  const prefetchResources = () => {
    // Prefetch widget data API
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = '/api/widgets-instances'
    document.head.appendChild(link)
    
    // Preconnect to external APIs
    const preconnect = document.createElement('link')
    preconnect.rel = 'preconnect'
    preconnect.href = 'https://api.openweathermap.org'
    document.head.appendChild(preconnect)
  }
  
  // Initialize optimizations
  onNuxtReady(() => {
    addPassiveEventListener()
    optimizeAnimations()
    batchStyleChanges()
    optimizeImages()
    setupPerformanceMonitoring()
    prefetchResources()
    
    // Re-optimize images on route change
    const router = useRouter()
    router.afterEach(() => {
      nextTick(() => {
        optimizeImages()
      })
    })
  })
  
  // Expose performance utilities
  return {
    provide: {
      performance: {
        mark: (name: string) => performance.mark?.(name),
        measure: (name: string, startMark: string, endMark: string) => {
          performance.measure?.(name, startMark, endMark)
          const measure = performance.getEntriesByName(name, 'measure')[0]
          if (measure) {
            console.log(`[Performance] ${name}: ${measure.duration.toFixed(2)}ms`)
          }
        }
      }
    }
  }
})