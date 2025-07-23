import { createResolver, defineNuxtModule, addServerHandler, useLogger } from 'nuxt/kit'
import { readdir, stat } from 'fs/promises'
import { join } from 'path'

const logger = useLogger('modules:widget-api')

export default defineNuxtModule({
  meta: {
    name: 'widget-api'
  },
  async setup() {
    const resolver = createResolver(import.meta.url)
    
    try {
      // Get widgets directory path
      const widgetsDir = resolver.resolve('../widgets')
      
      // Read all widget directories
      const widgetDirs = await readdir(widgetsDir)

      logger.info(`Found ${widgetDirs.length} widgets : ` + widgetDirs.join(', '))
      
      for (const widgetName of widgetDirs) {
        const widgetPath = join(widgetsDir, widgetName)
        const widgetStat = await stat(widgetPath)
        
        if (!widgetStat.isDirectory()) continue
        
        try {
          // Try to import the plugin.ts file
          const apiPath = join(widgetPath, 'api.ts')
          const apiExists = await stat(apiPath).catch(() => false)
          if (!apiExists) {
            logger.info(`No API routes found for widget: ${widgetName}`)
            continue
          }
          const api = await import(apiPath).then(m => m.apiRoutes)
          
          if (!api) {
            logger.warn(`No API routes found for widget despite api.ts file: ${widgetName}`, api)
            continue
          }
          
          logger.info(`Processing widget: ${widgetName} with ${api.length} API routes`)
          
          // Register each API route
          for (const route of api) {
            const handlerPath = `../widgets/${widgetName}/${route.handler}`
            
            // Resolve the handler path relative to the widget directory
            const apiPath = `/api/widgets/${widgetName.toLowerCase()}/${route.path}`
            
            addServerHandler({
              route: apiPath,
              method: route.method?.toLowerCase() as any,
              handler: resolver.resolve(handlerPath)
            })
            
            logger.success(`Registered route: ${route.method} ${apiPath}`)
          }
        } catch (error) {
          logger.warn(`Failed to load widget ${widgetName}:`, error)
        }
      }
    } catch (error) {
      logger.error('Failed to setup widget API routes:', error)
    }
  }
})