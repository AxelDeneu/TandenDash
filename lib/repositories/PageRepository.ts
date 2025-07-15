import { eq } from 'drizzle-orm'
import { db, pages, widgetInstance } from '@/lib/db'
import type { IPageRepository } from './interfaces'
import type { 
  Page, 
  CreatePageRequest, 
  UpdatePageRequest 
} from '@/types/page'
import type { WidgetInstance } from '@/types/widget'
import { CreatePageRequestSchema, UpdatePageRequestSchema } from '@/lib/validation'

export class PageRepository implements IPageRepository {
  async findById(id: number): Promise<Page | null> {
    const results = await db.select().from(pages).where(eq(pages.id, id))
    return results[0] || null
  }

  async findAll(): Promise<Page[]> {
    return await db.select().from(pages)
  }

  async findByName(name: string): Promise<Page | null> {
    const results = await db.select().from(pages).where(eq(pages.name, name))
    return results[0] || null
  }

  async findWithWidgets(id: number): Promise<Page & { widgets: WidgetInstance[] } | null> {
    const page = await this.findById(id)
    if (!page) return null

    const widgets = await db.select().from(widgetInstance).where(eq(widgetInstance.pageId, id))
    
    return {
      ...page,
      widgets
    }
  }

  async create(data: CreatePageRequest): Promise<Page> {
    // Validate input
    const validatedData = CreatePageRequestSchema.parse(data)
    
    // Check for duplicate names
    const existing = await this.findByName(validatedData.name)
    if (existing) {
      throw new Error(`Page with name "${validatedData.name}" already exists`)
    }
    
    const [created] = await db.insert(pages).values({
      name: validatedData.name,
      snapping: validatedData.snapping ?? false,
      gridRows: validatedData.gridRows ?? 6,
      gridCols: validatedData.gridCols ?? 6,
    }).returning()
    
    return created
  }

  async update(id: number, data: UpdatePageRequest): Promise<Page> {
    // Validate input
    const validatedData = UpdatePageRequestSchema.parse({ ...data, id })
    
    // Check if page exists
    const existing = await this.findById(id)
    if (!existing) {
      throw new Error(`Page with id ${id} not found`)
    }
    
    // Check for name conflicts if name is being updated
    if (validatedData.name && validatedData.name !== existing.name) {
      const nameConflict = await this.findByName(validatedData.name)
      if (nameConflict && nameConflict.id !== id) {
        throw new Error(`Page with name "${validatedData.name}" already exists`)
      }
    }
    
    // Build update object
    const updateData: Partial<{
      name: string
      snapping: boolean
      gridRows: number
      gridCols: number
      marginTop: number
      marginRight: number
      marginBottom: number
      marginLeft: number
    }> = {}
    
    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name
    }
    if (validatedData.snapping !== undefined) {
      updateData.snapping = validatedData.snapping
    }
    if (validatedData.gridRows !== undefined) {
      updateData.gridRows = validatedData.gridRows
    }
    if (validatedData.gridCols !== undefined) {
      updateData.gridCols = validatedData.gridCols
    }
    if (validatedData.marginTop !== undefined) {
      updateData.marginTop = validatedData.marginTop
    }
    if (validatedData.marginRight !== undefined) {
      updateData.marginRight = validatedData.marginRight
    }
    if (validatedData.marginBottom !== undefined) {
      updateData.marginBottom = validatedData.marginBottom
    }
    if (validatedData.marginLeft !== undefined) {
      updateData.marginLeft = validatedData.marginLeft
    }
    
    const [updated] = await db.update(pages)
      .set(updateData)
      .where(eq(pages.id, id))
      .returning()
    
    if (!updated) {
      throw new Error(`Page with id ${id} not found`)
    }
    
    return updated
  }

  async delete(id: number): Promise<boolean> {
    // Check if page exists
    const existing = await this.findById(id)
    if (!existing) {
      return false
    }
    
    // Use transaction to delete page and associated widgets
    await db.transaction(async (tx) => {
      // Delete associated widgets first (cascade should handle this, but being explicit)
      await tx.delete(widgetInstance).where(eq(widgetInstance.pageId, id))
      
      // Delete the page
      await tx.delete(pages).where(eq(pages.id, id))
    })
    
    return true
  }

  async updateGridSettings(id: number, gridRows: number, gridCols: number, snapping: boolean): Promise<Page> {
    // Validate grid settings
    if (gridRows < 1 || gridRows > 50) {
      throw new Error('Grid rows must be between 1 and 50')
    }
    if (gridCols < 1 || gridCols > 50) {
      throw new Error('Grid columns must be between 1 and 50')
    }
    
    const [updated] = await db.update(pages)
      .set({
        gridRows,
        gridCols,
        snapping
      })
      .where(eq(pages.id, id))
      .returning()
    
    if (!updated) {
      throw new Error(`Page with id ${id} not found`)
    }
    
    return updated
  }
}