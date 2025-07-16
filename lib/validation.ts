import { z } from 'zod'

// Widget validation schemas
export const WidgetPositionSchema = z.object({
  x: z.number().min(0),
  y: z.number().min(0),
  width: z.number().min(1),
  height: z.number().min(1)
})

export const WidgetPositionDBSchema = z.object({
  left: z.string().regex(/^\d+px$/),
  top: z.string().regex(/^\d+px$/),
  width: z.string().regex(/^\d+px$/),
  height: z.string().regex(/^\d+px$/)
})

export const CreateWidgetRequestSchema = z.object({
  type: z.string().min(1),
  position: WidgetPositionSchema,
  options: z.record(z.unknown()),
  pageId: z.number().int().positive().optional()
})

export const UpdateWidgetRequestSchema = z.object({
  id: z.number().int().positive(),
  position: WidgetPositionSchema.optional(),
  options: z.record(z.unknown()).optional(),
  pageId: z.number().int().positive().optional()
})

export const DeleteWidgetRequestSchema = z.object({
  id: z.number().int().positive()
})

// Page validation schemas
export const CreatePageRequestSchema = z.object({
  name: z.string().min(1).max(255),
  snapping: z.boolean().optional(),
  gridRows: z.number().int().min(1).max(50).optional(),
  gridCols: z.number().int().min(1).max(50).optional(),
  marginTop: z.number().int().min(0).max(200).optional(),
  marginRight: z.number().int().min(0).max(200).optional(),
  marginBottom: z.number().int().min(0).max(200).optional(),
  marginLeft: z.number().int().min(0).max(200).optional()
})

export const UpdatePageRequestSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(255).optional(),
  snapping: z.boolean().optional(),
  gridRows: z.number().int().min(1).max(50).optional(),
  gridCols: z.number().int().min(1).max(50).optional(),
  marginTop: z.number().int().min(0).max(200).optional(),
  marginRight: z.number().int().min(0).max(200).optional(),
  marginBottom: z.number().int().min(0).max(200).optional(),
  marginLeft: z.number().int().min(0).max(200).optional()
})

export const DeletePageRequestSchema = z.object({
  id: z.number().int().positive()
})

// Todo validation schemas
export const CreateTodoListRequestSchema = z.object({
  name: z.string().min(1).max(255)
})

export const UpdateTodoListRequestSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(255).optional()
})

export const CreateTodoItemRequestSchema = z.object({
  content: z.string().min(1).max(1000),
  todoListId: z.number().int().positive(),
  position: z.number().int().min(0).optional(),
  category: z.string().max(100).optional()
})

export const UpdateTodoItemRequestSchema = z.object({
  id: z.number().int().positive(),
  content: z.string().min(1).max(1000).optional(),
  checked: z.boolean().optional(),
  position: z.number().int().min(0).optional(),
  category: z.string().max(100).optional()
})

export const BatchUpdateTodoItemsRequestSchema = z.object({
  items: z.array(z.object({
    id: z.number().int().positive(),
    position: z.number().int().min(0).optional(),
    checked: z.boolean().optional()
  })).min(1)
})

// Widget-specific config schemas are now defined in individual widget definition files
// This eliminates duplication and ensures single source of truth for each widget's configuration

/**
 * Dynamic validation registry for widget configurations
 * Allows plugins to register their validation schemas without modifying core files
 */
export class WidgetValidationRegistry {
  private static instance: WidgetValidationRegistry
  private validationSchemas = new Map<string, z.ZodSchema<any>>()

  private constructor() {}

  static getInstance(): WidgetValidationRegistry {
    if (!WidgetValidationRegistry.instance) {
      WidgetValidationRegistry.instance = new WidgetValidationRegistry()
    }
    return WidgetValidationRegistry.instance
  }

  /**
   * Register a validation schema for a widget type
   */
  registerSchema<T>(widgetType: string, schema: z.ZodSchema<T>): void {
    if (this.validationSchemas.has(widgetType)) {
      console.warn(`Validation schema for widget type "${widgetType}" is already registered. Overwriting...`)
    }
    
    this.validationSchemas.set(widgetType, schema)
  }

  /**
   * Unregister a validation schema
   */
  unregisterSchema(widgetType: string): boolean {
    return this.validationSchemas.delete(widgetType)
  }

  /**
   * Get validation schema for a widget type
   */
  getSchema(widgetType: string): z.ZodSchema<any> | undefined {
    return this.validationSchemas.get(widgetType)
  }

  /**
   * Check if a validation schema is registered
   */
  hasSchema(widgetType: string): boolean {
    return this.validationSchemas.has(widgetType)
  }

  /**
   * Get all registered widget types
   */
  getRegisteredTypes(): string[] {
    return Array.from(this.validationSchemas.keys())
  }

  /**
   * Validate widget configuration using registered schema
   */
  validateConfig(widgetType: string, config: unknown): any {
    const schema = this.getSchema(widgetType)
    
    if (!schema) {
      throw new Error(`No validation schema registered for widget type: ${widgetType}`)
    }

    try {
      return schema.parse(config)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        ).join(', ')
        throw new Error(`Widget configuration validation failed for "${widgetType}": ${errorMessages}`)
      }
      throw error
    }
  }

  /**
   * Clear all registered schemas
   */
  clear(): void {
    this.validationSchemas.clear()
  }

  /**
   * Get registry status for debugging
   */
  getStatus(): {
    registeredTypes: string[]
    count: number
  } {
    return {
      registeredTypes: this.getRegisteredTypes(),
      count: this.validationSchemas.size
    }
  }
}

// Export singleton instance
export const widgetValidationRegistry = WidgetValidationRegistry.getInstance()

// Validation helper functions
export function validateWidgetConfig(type: string, config: unknown) {
  return widgetValidationRegistry.validateConfig(type, config)
}

// Helper function to register validation schema for custom widgets
export function registerWidgetValidationSchema<T>(widgetType: string, schema: z.ZodSchema<T>) {
  widgetValidationRegistry.registerSchema(widgetType, schema)
}

export function safeParseJson<T>(jsonString: string, schema: z.ZodSchema<T>): T {
  try {
    const parsed = JSON.parse(jsonString)
    return schema.parse(parsed)
  } catch (error) {
    throw new Error(`Invalid JSON or schema validation failed: ${error}`)
  }
}