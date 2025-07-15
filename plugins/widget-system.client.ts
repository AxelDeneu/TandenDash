import { defineNuxtPlugin } from '#app'
import { initializeWidgetSystem } from '@/lib/widgets'
import { WIDGET_DEFINITIONS } from '@/lib/widgets/widget-definitions'
import { useWidgetSystem } from '@/composables/useWidgetSystem'

export default defineNuxtPlugin({
  name: 'widget-system',
  async setup() {
    // Initialize widget system on client side only
    if (process.client) {
      console.log('[Widget System] Initializing widget system...')
      try {
        await initializeWidgetSystem()
        console.log('[Widget System] Widget system initialized successfully')
        
        // Get widget system instance
        const widgetSystem = useWidgetSystem()
        
        // Register all widget definitions for backward compatibility
        console.log('[Widget System] Registering widget definitions...')
        for (const definition of WIDGET_DEFINITIONS) {
          try {
            await widgetSystem.registerWidget(definition)
            console.log(`[Widget System] Registered widget: ${definition.name}`)
          } catch (error) {
            console.error(`[Widget System] Failed to register widget ${definition.name}:`, error)
          }
        }
        
        console.log('[Widget System] All widgets registered successfully')
      } catch (error) {
        console.error('[Widget System] Failed to initialize widget system:', error)
      }
    }
  }
})