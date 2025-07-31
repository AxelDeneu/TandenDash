import { createResolver, defineNuxtModule, addTemplate, useLogger } from 'nuxt/kit'
import { readdir, stat, readFile } from 'fs/promises'
import { join } from 'path'

const logger = useLogger('modules:widget-schemas')

interface WidgetSchemaInfo {
  widgetId: string
  schemaCode: string
}

export default defineNuxtModule({
  meta: {
    name: 'widget-schemas'
  },
  async setup(_, nuxt) {
    const resolver = createResolver(import.meta.url)
    const schemas: WidgetSchemaInfo[] = []
    
    try {
      // Get widgets directory path
      const widgetsDir = resolver.resolve('../widgets')
      
      // Read all widget directories
      const widgetDirs = await readdir(widgetsDir)
      
      logger.info(`Discovering widget schemas from ${widgetDirs.length} widgets`)
      
      for (const widgetName of widgetDirs) {
        const widgetPath = join(widgetsDir, widgetName)
        const widgetStat = await stat(widgetPath)
        
        if (!widgetStat.isDirectory()) continue
        
        try {
          // Check if definition.ts exists
          const definitionPath = join(widgetPath, 'definition.ts')
          const definitionExists = await stat(definitionPath).catch(() => false)
          
          if (!definitionExists) {
            logger.info(`No definition.ts found for widget: ${widgetName}`)
            continue
          }
          
          // Read the definition file content
          const content = await readFile(definitionPath, 'utf-8')
          
          // Extract the schema export using regex
          // Look for patterns like: export const WidgetConfigSchema = z.object({...})
          const schemaRegex = /export\s+const\s+WidgetConfigSchema\s*=\s*(z\.object\([^}]+\}[^}]*\}?\s*\))/s
          const match = content.match(schemaRegex)
          
          if (match && match[1]) {
            const widgetId = widgetName.toLowerCase()
            schemas.push({
              widgetId,
              schemaCode: match[1]
            })
            logger.success(`Extracted schema for widget: ${widgetId}`)
          } else {
            logger.warn(`Could not extract WidgetConfigSchema from ${widgetName}/definition.ts`)
          }
        } catch (error) {
          logger.error(`Failed to process widget ${widgetName}:`, error)
        }
      }
      
      // Generate the schemas file
      const schemasTemplate = `
// Auto-generated file by widget-schemas module
// DO NOT EDIT MANUALLY
import { z } from 'zod'
import { widgetValidationRegistry } from '@/lib/validation'

export const widgetSchemas = {
${schemas.map(s => `  '${s.widgetId}': ${s.schemaCode}`).join(',\n')}
}

// Register all schemas
export function registerAllWidgetSchemas() {
  Object.entries(widgetSchemas).forEach(([widgetId, schema]) => {
    widgetValidationRegistry.registerSchema(widgetId, schema)
  })
  
  console.log(\`[Widget Schemas] Registered \${Object.keys(widgetSchemas).length} widget schemas\`)
}
`

      // Add the template to the build
      addTemplate({
        filename: 'widget-schemas.generated.ts',
        write: true,
        getContents: () => schemasTemplate
      })
      
      // Also add to server utils for easy import
      addTemplate({
        filename: '../server/utils/widget-schemas.generated.ts',
        write: true,
        getContents: () => schemasTemplate
      })
      
      logger.success(`Generated widget schemas file with ${schemas.length} schemas`)
      
    } catch (error) {
      logger.error('Failed to setup widget schemas:', error)
    }
  }
})