import { defineNuxtPlugin } from '#app'
import { initializeWidgetSystem, getWidgetSystemInfo } from '@/lib/widgets'

export default defineNuxtPlugin({
  name: 'widget-system',
  async setup() {
    console.log('[Widget System Plugin] Setup called, process.client:', process.client)
    
    // Initialize widget system on client side only
    if (process.client) {
      console.log('[Widget System] Initializing widget system...')
      try {
        await initializeWidgetSystem()
        console.log('[Widget System] Widget system initialized successfully')
        
        // Log system info
        const systemInfo = getWidgetSystemInfo()
        console.log('[Widget System] System info:', systemInfo)
      } catch (error) {
        console.error('[Widget System] Failed to initialize widget system:', error)
      }
    }
  }
})