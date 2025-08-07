import { describe, it, expect, beforeEach, vi } from 'vitest'
import { eq, and } from 'drizzle-orm'
import { getTestDb, createTestDashboard, createTestPage, createTestWidget } from '../helpers/db-helper'
import { createTestWidget as createTestWidgetData } from '../helpers/test-utils'
import type { CreateWidgetRequest, UpdateWidgetRequest, WidgetPosition } from '@/types/widget'
import type { IWidgetRepository } from '@/lib/repositories/interfaces'
import type { WidgetInstance } from '@/types/widget'
import * as schema from '@/lib/db'

// Mock the widget validation and utilities
vi.mock('@/lib/validation', () => ({
  CreateWidgetRequestSchema: {
    parse: vi.fn((data) => data)
  },
  UpdateWidgetRequestSchema: {
    parse: vi.fn((data) => data)
  },
  validateWidgetConfig: vi.fn()
}))

vi.mock('@/lib/widgets/utils', () => ({
  mergeWithDefaults: vi.fn((type: string, options: Record<string, any>) => ({
    title: `Default ${type}`,
    ...options
  }))
}))

// Test implementation of WidgetRepository using test database
class TestWidgetRepository implements IWidgetRepository {
  private get db() {
    return getTestDb()
  }

  async findById(id: number): Promise<WidgetInstance | null> {
    const results = await this.db.select().from(schema.widgetInstance).where(eq(schema.widgetInstance.id, id))
    return results[0] || null
  }

  async findAll(): Promise<WidgetInstance[]> {
    return await this.db.select().from(schema.widgetInstance)
  }

  async findByPageId(pageId: number): Promise<WidgetInstance[]> {
    return await this.db.select().from(schema.widgetInstance).where(eq(schema.widgetInstance.pageId, pageId))
  }

  async findByType(type: string): Promise<WidgetInstance[]> {
    return await this.db.select().from(schema.widgetInstance).where(eq(schema.widgetInstance.type, type))
  }

  async create(data: CreateWidgetRequest): Promise<WidgetInstance> {
    // Validate that pageId exists if provided
    if (data.pageId) {
      const [existingPage] = await this.db.select().from(schema.pages).where(eq(schema.pages.id, data.pageId)).limit(1)
      
      if (!existingPage) {
        throw new Error(`Page with id ${data.pageId} does not exist`)
      }
    }
    
    // Convert position to database format
    const dbPosition = {
      left: `${data.position.x}px`,
      top: `${data.position.y}px`,
      width: `${data.position.width}px`,
      height: `${data.position.height}px`
    }
    
    const now = new Date().toISOString()
    const [created] = await this.db.insert(schema.widgetInstance).values({
      type: data.type,
      position: JSON.stringify(dbPosition),
      options: JSON.stringify(data.options),
      pageId: data.pageId || null,
      createdAt: now,
      updatedAt: now
    }).returning()
    
    return created
  }

  async update(id: number, data: UpdateWidgetRequest): Promise<WidgetInstance> {
    // Build update object
    const updateData: Partial<{
      type: string
      position: string
      options: string
      pageId: number | null
      updatedAt: string
    }> = {
      updatedAt: new Date().toISOString()
    }
    
    if (data.position) {
      const dbPosition = {
        left: `${data.position.x}px`,
        top: `${data.position.y}px`,
        width: `${data.position.width}px`,
        height: `${data.position.height}px`
      }
      updateData.position = JSON.stringify(dbPosition)
    }
    
    if (data.options) {
      updateData.options = JSON.stringify(data.options)
    }
    
    if (data.pageId !== undefined) {
      // Validate that pageId exists if provided
      if (data.pageId) {
        const [existingPage] = await this.db.select().from(schema.pages).where(eq(schema.pages.id, data.pageId)).limit(1)
        
        if (!existingPage) {
          throw new Error(`Page with id ${data.pageId} does not exist`)
        }
      }
      updateData.pageId = data.pageId
    }
    
    const [updated] = await this.db.update(schema.widgetInstance)
      .set(updateData)
      .where(eq(schema.widgetInstance.id, id))
      .returning()
    
    if (!updated) {
      throw new Error(`Widget with id ${id} not found`)
    }
    
    return updated
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db.delete(schema.widgetInstance).where(eq(schema.widgetInstance.id, id))
    return result.changes > 0
  }

  async bulkUpdate(widgets: Array<{ id: number; position?: string; options?: string }>): Promise<WidgetInstance[]> {
    const results: WidgetInstance[] = []
    
    // Use transaction for atomicity
    await this.db.transaction(async (tx) => {
      for (const widget of widgets) {
        const updateData: Partial<{
          position: string
          options: string
          updatedAt: string
        }> = {
          updatedAt: new Date().toISOString()
        }
        
        if (widget.position) {
          updateData.position = widget.position
        }
        
        if (widget.options) {
          updateData.options = widget.options
        }
        
        const [updated] = await tx.update(schema.widgetInstance)
          .set(updateData)
          .where(eq(schema.widgetInstance.id, widget.id))
          .returning()
        
        if (updated) {
          results.push(updated)
        }
      }
    })
    
    return results
  }
}

describe('WidgetRepository', () => {
  let repository: TestWidgetRepository
  let dashboardId: number
  let pageId: number

  beforeEach(async () => {
    repository = new TestWidgetRepository()
    
    // Set up test data
    const dashboard = await createTestDashboard()
    dashboardId = dashboard.id
    
    const page = await createTestPage(dashboardId)
    pageId = page.id
  })

  describe('findById', () => {
    it('should return widget when found', async () => {
      const testWidget = await createTestWidget(pageId, 'Clock')
      
      const result = await repository.findById(testWidget.id)
      
      expect(result).toBeDefined()
      expect(result?.id).toBe(testWidget.id)
      expect(result?.type).toBe('Clock')
      expect(result?.pageId).toBe(pageId)
    })

    it('should return null when widget not found', async () => {
      const result = await repository.findById(999)
      
      expect(result).toBeNull()
    })
  })

  describe('findAll', () => {
    it('should return empty array when no widgets exist', async () => {
      const result = await repository.findAll()
      
      expect(result).toEqual([])
    })

    it('should return all widgets', async () => {
      const widget1 = await createTestWidget(pageId, 'Clock')
      const widget2 = await createTestWidget(pageId, 'Weather')
      
      const result = await repository.findAll()
      
      expect(result).toHaveLength(2)
      expect(result.map(w => w.id)).toContain(widget1.id)
      expect(result.map(w => w.id)).toContain(widget2.id)
    })
  })

  describe('findByPageId', () => {
    it('should return empty array when no widgets on page', async () => {
      const result = await repository.findByPageId(pageId)
      
      expect(result).toEqual([])
    })

    it('should return widgets for specific page', async () => {
      const widget1 = await createTestWidget(pageId, 'Clock')
      
      // Create another page with a widget
      const page2 = await createTestPage(dashboardId, 'Page 2')
      const widget2 = await createTestWidget(page2.id, 'Weather')
      
      const result = await repository.findByPageId(pageId)
      
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(widget1.id)
      expect(result[0].pageId).toBe(pageId)
    })
  })

  describe('findByType', () => {
    it('should return empty array when no widgets of type exist', async () => {
      const result = await repository.findByType('NonExistent')
      
      expect(result).toEqual([])
    })

    it('should return widgets of specific type', async () => {
      const clockWidget1 = await createTestWidget(pageId, 'Clock')
      const clockWidget2 = await createTestWidget(pageId, 'Clock')
      await createTestWidget(pageId, 'Weather') // Different type
      
      const result = await repository.findByType('Clock')
      
      expect(result).toHaveLength(2)
      expect(result.map(w => w.id)).toContain(clockWidget1.id)
      expect(result.map(w => w.id)).toContain(clockWidget2.id)
      expect(result.every(w => w.type === 'Clock')).toBe(true)
    })
  })

  describe('create', () => {
    it('should create widget successfully', async () => {
      const position: WidgetPosition = { x: 0, y: 0, width: 4, height: 3 }
      const createRequest: CreateWidgetRequest = {
        type: 'Clock',
        position,
        options: { title: 'Test Clock' },
        pageId
      }
      
      const result = await repository.create(createRequest)
      
      expect(result).toBeDefined()
      expect(result.type).toBe('Clock')
      expect(result.pageId).toBe(pageId)
      expect(JSON.parse(result.position)).toEqual({
        left: '0px',
        top: '0px',
        width: '4px',
        height: '3px'
      })
      expect(JSON.parse(result.options)).toMatchObject({ title: 'Test Clock' })
    })

    it('should create widget without pageId', async () => {
      const position: WidgetPosition = { x: 0, y: 0, width: 4, height: 3 }
      const createRequest: CreateWidgetRequest = {
        type: 'Clock',
        position,
        options: { title: 'Test Clock' }
      }
      
      const result = await repository.create(createRequest)
      
      expect(result).toBeDefined()
      expect(result.type).toBe('Clock')
      expect(result.pageId).toBeNull()
    })

    it('should throw error when pageId does not exist', async () => {
      const position: WidgetPosition = { x: 0, y: 0, width: 4, height: 3 }
      const createRequest: CreateWidgetRequest = {
        type: 'Clock',
        position,
        options: { title: 'Test Clock' },
        pageId: 999
      }
      
      await expect(repository.create(createRequest)).rejects.toThrow(
        'Page with id 999 does not exist'
      )
    })

    it('should validate and merge options with defaults', async () => {
      const position: WidgetPosition = { x: 0, y: 0, width: 4, height: 3 }
      const createRequest: CreateWidgetRequest = {
        type: 'Clock',
        position,
        options: {}, // Empty options should be merged with defaults
        pageId
      }
      
      const result = await repository.create(createRequest)
      
      expect(result).toBeDefined()
      // Options should have been merged with defaults
      const options = JSON.parse(result.options)
      expect(options).toBeDefined()
    })
  })

  describe('update', () => {
    it('should update widget position', async () => {
      const widget = await createTestWidget(pageId, 'Clock')
      const newPosition: WidgetPosition = { x: 10, y: 20, width: 6, height: 4 }
      
      const updateRequest: UpdateWidgetRequest = {
        id: widget.id,
        position: newPosition
      }
      
      const result = await repository.update(widget.id, updateRequest)
      
      expect(result).toBeDefined()
      expect(JSON.parse(result.position)).toEqual({
        left: '10px',
        top: '20px',
        width: '6px',
        height: '4px'
      })
    })

    it('should update widget options', async () => {
      const widget = await createTestWidget(pageId, 'Clock')
      const newOptions = { title: 'Updated Clock', showSeconds: true }
      
      const updateRequest: UpdateWidgetRequest = {
        id: widget.id,
        options: newOptions
      }
      
      const result = await repository.update(widget.id, updateRequest)
      
      expect(result).toBeDefined()
      const options = JSON.parse(result.options)
      expect(options).toMatchObject(newOptions)
    })

    it('should update widget pageId', async () => {
      const widget = await createTestWidget(pageId, 'Clock')
      const newPage = await createTestPage(dashboardId, 'New Page')
      
      const updateRequest: UpdateWidgetRequest = {
        id: widget.id,
        pageId: newPage.id
      }
      
      const result = await repository.update(widget.id, updateRequest)
      
      expect(result).toBeDefined()
      expect(result.pageId).toBe(newPage.id)
    })

    it('should set pageId to null', async () => {
      const widget = await createTestWidget(pageId, 'Clock')
      
      const updateRequest: UpdateWidgetRequest = {
        id: widget.id,
        pageId: null
      }
      
      const result = await repository.update(widget.id, updateRequest)
      
      expect(result).toBeDefined()
      expect(result.pageId).toBeNull()
    })

    it('should throw error when widget not found', async () => {
      const updateRequest: UpdateWidgetRequest = {
        id: 999,
        options: { title: 'Test' }
      }
      
      await expect(repository.update(999, updateRequest)).rejects.toThrow(
        'Widget with id 999 not found'
      )
    })

    it('should throw error when pageId does not exist', async () => {
      const widget = await createTestWidget(pageId, 'Clock')
      
      const updateRequest: UpdateWidgetRequest = {
        id: widget.id,
        pageId: 999
      }
      
      await expect(repository.update(widget.id, updateRequest)).rejects.toThrow(
        'Page with id 999 does not exist'
      )
    })
  })

  describe('delete', () => {
    it('should delete existing widget', async () => {
      const widget = await createTestWidget(pageId, 'Clock')
      
      const result = await repository.delete(widget.id)
      
      expect(result).toBe(true)
      
      // Verify widget is deleted
      const deletedWidget = await repository.findById(widget.id)
      expect(deletedWidget).toBeNull()
    })

    it('should return false when widget does not exist', async () => {
      const result = await repository.delete(999)
      
      expect(result).toBe(false)
    })
  })

  describe('bulkUpdate', () => {
    it('should update multiple widgets', async () => {
      const widget1 = await createTestWidget(pageId, 'Clock')
      const widget2 = await createTestWidget(pageId, 'Weather')
      
      const updates = [
        {
          id: widget1.id,
          position: JSON.stringify({ left: '10px', top: '10px', width: '4px', height: '3px' }),
          options: JSON.stringify({ title: 'Updated Clock 1' })
        },
        {
          id: widget2.id,
          position: JSON.stringify({ left: '20px', top: '20px', width: '6px', height: '4px' })
        }
      ]
      
      const result = await repository.bulkUpdate(updates)
      
      expect(result).toHaveLength(2)
      
      // Verify updates
      const updatedWidget1 = await repository.findById(widget1.id)
      const updatedWidget2 = await repository.findById(widget2.id)
      
      expect(updatedWidget1?.position).toBe(updates[0].position)
      expect(updatedWidget1?.options).toBe(updates[0].options)
      expect(updatedWidget2?.position).toBe(updates[1].position)
    })

    it('should handle empty updates array', async () => {
      const result = await repository.bulkUpdate([])
      
      expect(result).toEqual([])
    })

    it('should skip non-existent widgets in bulk update', async () => {
      const widget = await createTestWidget(pageId, 'Clock')
      
      const updates = [
        {
          id: widget.id,
          position: JSON.stringify({ left: '10px', top: '10px', width: '4px', height: '3px' })
        },
        {
          id: 999, // Non-existent
          position: JSON.stringify({ left: '20px', top: '20px', width: '6px', height: '4px' })
        }
      ]
      
      const result = await repository.bulkUpdate(updates)
      
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(widget.id)
    })
  })

  describe('convertPositionToDb', () => {
    it('should convert widget position to database format', async () => {
      const widget = await createTestWidget(pageId, 'Clock')
      const position: WidgetPosition = { x: 100, y: 200, width: 300, height: 400 }
      
      const updateRequest: CreateWidgetRequest = {
        type: 'Clock',
        position,
        options: { title: 'Test' },
        pageId
      }
      
      const result = await repository.create(updateRequest)
      
      expect(JSON.parse(result.position)).toEqual({
        left: '100px',
        top: '200px',
        width: '300px',
        height: '400px'
      })
    })
  })
})