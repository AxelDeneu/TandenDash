import { eq, and } from 'drizzle-orm'
import { db, widgetInstance, pages } from '@/lib/db'
import type { IWidgetRepository } from './interfaces'
import type { 
  WidgetInstance, 
  CreateWidgetRequest, 
  UpdateWidgetRequest,
  WidgetPosition 
} from '@/types/widget'
import { CreateWidgetRequestSchema, UpdateWidgetRequestSchema, validateWidgetConfig } from '@/lib/validation'

export class WidgetRepository implements IWidgetRepository {

  async findById(id: number): Promise<WidgetInstance | null> {
    const results = await db.select().from(widgetInstance).where(eq(widgetInstance.id, id))
    return results[0] || null
  }

  async findAll(): Promise<WidgetInstance[]> {
    return await db.select().from(widgetInstance)
  }

  async findByPageId(pageId: number): Promise<WidgetInstance[]> {
    return await db.select().from(widgetInstance).where(eq(widgetInstance.pageId, pageId))
  }

  async findByType(type: string): Promise<WidgetInstance[]> {
    return await db.select().from(widgetInstance).where(eq(widgetInstance.type, type))
  }

  async create(data: CreateWidgetRequest): Promise<WidgetInstance> {
    // Validate input
    const validatedData = CreateWidgetRequestSchema.parse(data)
    
    // Validate widget-specific configuration
    validateWidgetConfig(validatedData.type, validatedData.options)
    
    // Validate that pageId exists if provided
    if (validatedData.pageId) {
      const [existingPage] = await db.select().from(pages).where(eq(pages.id, validatedData.pageId)).limit(1)
      
      if (!existingPage) {
        // Get available pages for better error message
        const availablePages = await db.select().from(pages)
        throw new Error(`Page with id ${validatedData.pageId} does not exist. Available pages: ${availablePages.map(p => `${p.id}:${p.name}`).join(', ') || 'none'}`)
      }
    }
    
    // Convert position to database format
    const dbPosition = this.convertPositionToDb(validatedData.position)
    
    const [created] = await db.insert(widgetInstance).values({
      type: validatedData.type,
      position: JSON.stringify(dbPosition),
      options: JSON.stringify(validatedData.options),
      ...(validatedData.pageId ? { pageId: validatedData.pageId } : {}),
    }).returning()
    
    return created
  }

  async update(id: number, data: UpdateWidgetRequest): Promise<WidgetInstance> {
    // Validate input
    const validatedData = UpdateWidgetRequestSchema.parse({ ...data, id })
    
    // Build update object
    const updateData: Partial<{
      type: string
      position: string
      options: string
      pageId: number | null
    }> = {}
    
    if (validatedData.position) {
      updateData.position = JSON.stringify(this.convertPositionToDb(validatedData.position))
    }
    
    if (validatedData.options) {
      // If we're updating options, we need the current type to validate
      const current = await this.findById(id)
      if (!current) {
        throw new Error(`Widget with id ${id} not found`)
      }
      validateWidgetConfig(current.type, validatedData.options)
      updateData.options = JSON.stringify(validatedData.options)
    }
    
    if (validatedData.pageId !== undefined) {
      // Validate that pageId exists if provided
      if (validatedData.pageId) {
        const [existingPage] = await db.select().from(pages).where(eq(pages.id, validatedData.pageId)).limit(1)
        
        if (!existingPage) {
          const availablePages = await db.select().from(pages)
          throw new Error(`Page with id ${validatedData.pageId} does not exist. Available pages: ${availablePages.map(p => `${p.id}:${p.name}`).join(', ') || 'none'}`)
        }
      }
      updateData.pageId = validatedData.pageId
    }
    
    const [updated] = await db.update(widgetInstance)
      .set(updateData)
      .where(eq(widgetInstance.id, id))
      .returning()
    
    if (!updated) {
      throw new Error(`Widget with id ${id} not found`)
    }
    
    return updated
  }

  async delete(id: number): Promise<boolean> {
    const result = await db.delete(widgetInstance).where(eq(widgetInstance.id, id))
    return result.changes > 0
  }

  async bulkUpdate(widgets: Array<{ id: number; position?: string; options?: string }>): Promise<WidgetInstance[]> {
    const results: WidgetInstance[] = []
    
    // Use transaction for atomicity
    await db.transaction(async (tx) => {
      for (const widget of widgets) {
        const updateData: Partial<{
          position: string
          options: string
        }> = {}
        
        if (widget.position) {
          updateData.position = widget.position
        }
        
        if (widget.options) {
          updateData.options = widget.options
        }
        
        const [updated] = await tx.update(widgetInstance)
          .set(updateData)
          .where(eq(widgetInstance.id, widget.id))
          .returning()
        
        if (updated) {
          results.push(updated)
        }
      }
    })
    
    return results
  }

  private convertPositionToDb(position: WidgetPosition) {
    return {
      left: `${position.x}px`,
      top: `${position.y}px`,
      width: `${position.width}px`,
      height: `${position.height}px`
    }
  }
}