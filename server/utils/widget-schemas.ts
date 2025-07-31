import { widgetValidationRegistry } from '@/lib/validation'

let schemasLoaded = false

/**
 * Load all widget schemas into the validation registry
 * This function uses the auto-generated schemas file from the build process
 */
export async function loadWidgetSchemas(): Promise<void> {
  if (schemasLoaded) {
    console.log('[Widget Schemas] Schemas already loaded, skipping...')
    return
  }

  try {
    // Import the generated schemas file
    const { registerAllWidgetSchemas } = await import('./widget-schemas.generated')
    
    // Register all schemas
    registerAllWidgetSchemas()
    
    schemasLoaded = true
    
    // Log registry status for debugging
    const status = widgetValidationRegistry.getStatus()
    console.log('[Widget Schemas] Registry status:', status)
  } catch (error) {
    console.error('[Widget Schemas] Failed to load widget schemas:', error)
    throw error
  }
}