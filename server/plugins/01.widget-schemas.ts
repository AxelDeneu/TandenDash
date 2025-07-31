import { loadWidgetSchemas } from '../utils/widget-schemas'

/**
 * Nitro plugin to load widget validation schemas on server startup
 * This ensures that all widget schemas are available for API validation
 */
export default defineNitroPlugin(async (nitroApp) => {
  console.log('[Nitro Plugin] Loading widget validation schemas...')
  
  try {
    await loadWidgetSchemas()
    console.log('[Nitro Plugin] Widget schemas loaded successfully')
  } catch (error) {
    console.error('[Nitro Plugin] Failed to load widget schemas:', error)
    // Don't throw here to avoid breaking the server startup
    // The validation will fail gracefully when needed
  }
})