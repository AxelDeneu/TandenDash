import { z } from 'zod'
import type { WidgetEvents } from './widget-events'

// Base schemas for common types
const widgetInstanceSchema = z.object({
  id: z.number(),
  type: z.string(),
  position: z.string(), // JSON string
  options: z.string(), // JSON string
  pageId: z.number().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  // Optional runtime properties
  _dragPos: z.object({
    left: z.number(),
    top: z.number()
  }).optional(),
  _resize: z.object({
    width: z.number(),
    height: z.number()
  }).optional()
})

const errorSchema = z.object({
  name: z.string(),
  message: z.string(),
  stack: z.string().optional()
})

// Event payload schemas
export const widgetEventSchemas = {
  // Widget lifecycle events
  'widget:created': z.tuple([widgetInstanceSchema]),
  'widget:updated': z.tuple([widgetInstanceSchema, widgetInstanceSchema]),
  'widget:deleted': z.tuple([z.number()]),
  'widget:moved': z.tuple([z.number(), z.number(), z.number()]),
  'widget:resized': z.tuple([z.number(), z.number(), z.number()]),
  
  // Widget state events
  'widget:error': z.tuple([z.number(), errorSchema]),
  'widget:loading': z.tuple([z.number(), z.boolean()]),
  'widget:data:updated': z.tuple([z.number(), z.unknown()]),
  'widget:config:changed': z.tuple([z.number(), z.unknown(), z.unknown()]),
  
  // Widget interaction events
  'widget:selected': z.tuple([z.number()]),
  'widget:deselected': z.tuple([z.number()]),
  'widget:focused': z.tuple([z.number()]),
  'widget:blurred': z.tuple([z.number()]),
  
  // Page events
  'page:changed': z.tuple([z.number()]),
  'page:created': z.tuple([z.number()]),
  'page:deleted': z.tuple([z.number()]),
  'page:updated': z.tuple([z.number()]),
  
  // Edit mode events
  'editMode:changed': z.tuple([z.boolean()]),
  'editMode:dragStart': z.tuple([z.number()]),
  'editMode:dragEnd': z.tuple([z.number()]),
  'editMode:resizeStart': z.tuple([z.number()]),
  'editMode:resizeEnd': z.tuple([z.number()]),
  
  // Theme events
  'theme:changed': z.tuple([z.boolean()]),
  
  // Grid events
  'grid:snappingChanged': z.tuple([z.boolean()]),
  'grid:sizeChanged': z.tuple([z.number(), z.number()])
} as const

export type WidgetEventSchemas = typeof widgetEventSchemas

/**
 * Validates event payload against its schema
 */
export function validateEventPayload<K extends keyof WidgetEvents>(
  event: K,
  args: WidgetEvents[K]
): { success: true; data: WidgetEvents[K] } | { success: false; error: string } {
  try {
    const schema = widgetEventSchemas[event as keyof WidgetEventSchemas]
    if (!schema) {
      return { success: false, error: `No validation schema defined for event '${String(event)}'` }
    }
    
    const result = schema.parse(args)
    return { success: true, data: result as WidgetEvents[K] }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      return { success: false, error: `Event payload validation failed: ${errorMessage}` }
    }
    
    return { success: false, error: `Unknown validation error: ${error}` }
  }
}

/**
 * Development-only event validation warning
 */
export function validateEventInDevelopment<K extends keyof WidgetEvents>(
  event: K,
  args: WidgetEvents[K]
): void {
  if (process.env.NODE_ENV === 'development') {
    const result = validateEventPayload(event, args)
    if (!result.success) {
      console.warn(`[Widget Event Validation] ${result.error}`, { event, args })
    }
  }
}

/**
 * Lenient validation that allows events to proceed even if validation fails
 * Only logs warnings in development mode
 */
export function validateEventPayloadLenient<K extends keyof WidgetEvents>(
  event: K,
  args: WidgetEvents[K]
): { success: true; data: WidgetEvents[K] } {
  try {
    const schema = widgetEventSchemas[event as keyof WidgetEventSchemas]
    if (schema) {
      const result = schema.parse(args)
      return { success: true, data: result as WidgetEvents[K] }
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        console.warn(`[Widget Event Validation] Lenient validation failed for '${String(event)}': ${errorMessage}`, { event, args })
      } else {
        console.warn(`[Widget Event Validation] Unknown validation error for '${String(event)}':`, error)
      }
    }
  }
  
  // Always return success in lenient mode, using original args
  return { success: true, data: args }
}