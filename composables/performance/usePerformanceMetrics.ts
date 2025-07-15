interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: number
  category: 'render' | 'api' | 'interaction' | 'memory'
}

/**
 * Performance metrics collection and reporting
 */
export function usePerformanceMetrics() {
  const metrics = ref<PerformanceMetric[]>([])
  const isRecording = ref(false)
  
  /**
   * Start recording performance metrics
   */
  const startRecording = () => {
    isRecording.value = true
    metrics.value = []
    
    // Start monitoring
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      observePerformance()
    }
  }
  
  /**
   * Stop recording performance metrics
   */
  const stopRecording = () => {
    isRecording.value = false
  }
  
  /**
   * Record a custom metric
   */
  const recordMetric = (metric: Omit<PerformanceMetric, 'timestamp'>) => {
    if (!isRecording.value) return
    
    metrics.value.push({
      ...metric,
      timestamp: performance.now()
    })
  }
  
  /**
   * Measure render time
   */
  const measureRender = async (name: string, renderFn: () => Promise<void> | void) => {
    if (!isRecording.value) {
      await renderFn()
      return
    }
    
    const start = performance.now()
    await renderFn()
    const duration = performance.now() - start
    
    recordMetric({
      name: `Render: ${name}`,
      value: duration,
      unit: 'ms',
      category: 'render'
    })
    
    return duration
  }
  
  /**
   * Measure API call time
   */
  const measureAPI = async <T>(name: string, apiFn: () => Promise<T>): Promise<T> => {
    if (!isRecording.value) {
      return await apiFn()
    }
    
    const start = performance.now()
    try {
      const result = await apiFn()
      const duration = performance.now() - start
      
      recordMetric({
        name: `API: ${name}`,
        value: duration,
        unit: 'ms',
        category: 'api'
      })
      
      return result
    } catch (error) {
      const duration = performance.now() - start
      
      recordMetric({
        name: `API Error: ${name}`,
        value: duration,
        unit: 'ms',
        category: 'api'
      })
      
      throw error
    }
  }
  
  /**
   * Measure interaction time
   */
  const measureInteraction = (name: string, interactionFn: () => void) => {
    if (!isRecording.value) {
      interactionFn()
      return
    }
    
    const start = performance.now()
    interactionFn()
    const duration = performance.now() - start
    
    recordMetric({
      name: `Interaction: ${name}`,
      value: duration,
      unit: 'ms',
      category: 'interaction'
    })
    
    return duration
  }
  
  /**
   * Get memory usage
   */
  const getMemoryUsage = () => {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
      const memory = (performance as any).memory
      
      recordMetric({
        name: 'Memory: Used JS Heap',
        value: memory.usedJSHeapSize / 1048576, // Convert to MB
        unit: 'MB',
        category: 'memory'
      })
      
      recordMetric({
        name: 'Memory: Total JS Heap',
        value: memory.totalJSHeapSize / 1048576, // Convert to MB
        unit: 'MB',
        category: 'memory'
      })
      
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      }
    }
    
    return null
  }
  
  /**
   * Observe performance entries
   */
  const observePerformance = () => {
    // Observe paint timing
    try {
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          recordMetric({
            name: `Paint: ${entry.name}`,
            value: entry.startTime,
            unit: 'ms',
            category: 'render'
          })
        }
      })
      paintObserver.observe({ entryTypes: ['paint'] })
    } catch (e) {
      // Paint timing not supported
    }
    
    // Observe largest contentful paint
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        
        recordMetric({
          name: 'Largest Contentful Paint',
          value: lastEntry.startTime,
          unit: 'ms',
          category: 'render'
        })
      })
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
    } catch (e) {
      // LCP not supported
    }
  }
  
  /**
   * Get metrics summary
   */
  const getMetricsSummary = () => {
    const summary = {
      render: {
        count: 0,
        total: 0,
        average: 0,
        min: Infinity,
        max: 0
      },
      api: {
        count: 0,
        total: 0,
        average: 0,
        min: Infinity,
        max: 0
      },
      interaction: {
        count: 0,
        total: 0,
        average: 0,
        min: Infinity,
        max: 0
      }
    }
    
    metrics.value.forEach(metric => {
      if (metric.category === 'memory') return
      
      const category = summary[metric.category]
      category.count++
      category.total += metric.value
      category.min = Math.min(category.min, metric.value)
      category.max = Math.max(category.max, metric.value)
    })
    
    // Calculate averages
    Object.values(summary).forEach(category => {
      if (category.count > 0) {
        category.average = category.total / category.count
      }
    })
    
    return summary
  }
  
  /**
   * Export metrics as CSV
   */
  const exportMetrics = () => {
    const csv = [
      'Name,Value,Unit,Category,Timestamp',
      ...metrics.value.map(m => 
        `"${m.name}",${m.value.toFixed(2)},${m.unit},${m.category},${m.timestamp.toFixed(2)}`
      )
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `performance-metrics-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }
  
  /**
   * Clear all metrics
   */
  const clearMetrics = () => {
    metrics.value = []
  }
  
  return {
    metrics: readonly(metrics),
    isRecording: readonly(isRecording),
    startRecording,
    stopRecording,
    recordMetric,
    measureRender,
    measureAPI,
    measureInteraction,
    getMemoryUsage,
    getMetricsSummary,
    exportMetrics,
    clearMetrics
  }
}