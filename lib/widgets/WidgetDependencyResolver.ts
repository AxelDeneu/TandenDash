import { existsSync } from 'fs'
import { join, resolve } from 'path'

export interface WidgetPackageInfo {
  name: string
  version: string
  dependencies?: Record<string, string>
  hasNodeModules: boolean
  widgetPath: string
}

export class WidgetDependencyResolver {
  private static widgetsDir = resolve(process.cwd(), 'widgets')
  
  /**
   * Check if a widget has its own package.json
   */
  static hasPackageJson(widgetName: string): boolean {
    const packagePath = join(this.widgetsDir, widgetName, 'package.json')
    return existsSync(packagePath)
  }
  
  /**
   * Check if a widget has node_modules installed
   */
  static hasNodeModules(widgetName: string): boolean {
    const nodeModulesPath = join(this.widgetsDir, widgetName, 'node_modules')
    return existsSync(nodeModulesPath)
  }
  
  /**
   * Get package info for a widget
   */
  static async getPackageInfo(widgetName: string): Promise<WidgetPackageInfo | null> {
    if (!this.hasPackageJson(widgetName)) {
      return null
    }
    
    try {
      const packagePath = join(this.widgetsDir, widgetName, 'package.json')
      const packageJson = await import(packagePath, {
        assert: { type: 'json' }
      })
      
      return {
        name: packageJson.default.name || `@widget/${widgetName}`,
        version: packageJson.default.version || '1.0.0',
        dependencies: packageJson.default.dependencies,
        hasNodeModules: this.hasNodeModules(widgetName),
        widgetPath: join(this.widgetsDir, widgetName)
      }
    } catch (error) {
      console.error(`Failed to load package.json for widget ${widgetName}:`, error)
      return null
    }
  }
  
  /**
   * Create import map for widget dependencies
   */
  static createImportMap(widgetName: string): Record<string, string> {
    const importMap: Record<string, string> = {}
    
    if (this.hasNodeModules(widgetName)) {
      const nodeModulesPath = join(this.widgetsDir, widgetName, 'node_modules')
      
      // Add mapping for the widget's node_modules
      importMap[`@widget/${widgetName}/node_modules`] = nodeModulesPath
      
      // In development, we can use the actual path
      if (process.env.NODE_ENV === 'development') {
        importMap[`@widget/${widgetName}`] = join(this.widgetsDir, widgetName)
      }
    }
    
    return importMap
  }
  
  /**
   * Resolve a module for a specific widget
   */
  static resolveModule(widgetName: string, moduleName: string): string | null {
    // First try widget's own node_modules
    const widgetModulePath = join(this.widgetsDir, widgetName, 'node_modules', moduleName)
    if (existsSync(widgetModulePath)) {
      return widgetModulePath
    }
    
    // Fall back to root node_modules
    try {
      return require.resolve(moduleName)
    } catch {
      return null
    }
  }
  
  /**
   * Get all widgets with package.json
   */
  static async getAllWidgetPackages(): Promise<WidgetPackageInfo[]> {
    const widgets: WidgetPackageInfo[] = []
    
    try {
      const { readdirSync, statSync } = await import('fs')
      const entries = readdirSync(this.widgetsDir)
      
      for (const entry of entries) {
        const widgetPath = join(this.widgetsDir, entry)
        const stat = statSync(widgetPath)
        
        if (stat.isDirectory()) {
          const packageInfo = await this.getPackageInfo(entry)
          if (packageInfo) {
            widgets.push(packageInfo)
          }
        }
      }
    } catch (error) {
      console.error('Failed to get widget packages:', error)
    }
    
    return widgets
  }
}