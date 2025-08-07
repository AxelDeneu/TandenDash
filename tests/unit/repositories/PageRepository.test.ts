import { describe, it, expect, beforeEach, vi } from 'vitest'
import { eq } from 'drizzle-orm'
import { getTestDb, createTestDashboard, createTestPage, createTestWidget } from '../helpers/db-helper'
import type { CreatePageRequest, UpdatePageRequest, Page } from '@/types/page'
import type { IPageRepository } from '@/lib/repositories/interfaces'
import type { WidgetInstance } from '@/types/widget'
import * as schema from '@/lib/db'

// Mock the validation
vi.mock('@/lib/validation', () => ({
  CreatePageRequestSchema: {
    parse: vi.fn((data) => data)
  },
  UpdatePageRequestSchema: {
    parse: vi.fn((data) => data)
  }
}))

// Test implementation of PageRepository using test database
class TestPageRepository implements IPageRepository {
  private get db() {
    return getTestDb()
  }

  async findById(id: number): Promise<Page | null> {
    const results = await this.db.select().from(schema.pages).where(eq(schema.pages.id, id))
    return results[0] || null
  }

  async findAll(): Promise<Page[]> {
    return await this.db.select().from(schema.pages)
  }

  async findByDashboardId(dashboardId: number): Promise<Page[]> {
    return await this.db.select().from(schema.pages).where(eq(schema.pages.dashboardId, dashboardId))
  }

  async findByName(name: string): Promise<Page | null> {
    const results = await this.db.select().from(schema.pages).where(eq(schema.pages.name, name))
    return results[0] || null
  }

  async findWithWidgets(id: number): Promise<Page & { widgets: WidgetInstance[] } | null> {
    const page = await this.findById(id)
    if (!page) return null

    const widgets = await this.db.select().from(schema.widgetInstance).where(eq(schema.widgetInstance.pageId, id))
    
    return {
      ...page,
      widgets
    }
  }

  async create(data: CreatePageRequest): Promise<Page> {
    // Check for duplicate names
    const existing = await this.findByName(data.name)
    if (existing) {
      throw new Error(`Page with name "${data.name}" already exists`)
    }
    
    const now = new Date().toISOString()
    const [created] = await this.db.insert(schema.pages).values({
      name: data.name,
      dashboardId: data.dashboardId || null,
      snapping: data.snapping ?? false,
      gridRows: data.gridRows ?? 6,
      gridCols: data.gridCols ?? 6,
      marginTop: data.marginTop ?? 16,
      marginRight: data.marginRight ?? 16,
      marginBottom: data.marginBottom ?? 16,
      marginLeft: data.marginLeft ?? 16,
      createdAt: now,
      updatedAt: now
    }).returning()
    
    return created
  }

  async update(id: number, data: UpdatePageRequest): Promise<Page> {
    // Check if page exists
    const existing = await this.findById(id)
    if (!existing) {
      throw new Error(`Page with id ${id} not found`)
    }
    
    // Check for name conflicts if name is being updated
    if (data.name && data.name !== existing.name) {
      const nameConflict = await this.findByName(data.name)
      if (nameConflict && nameConflict.id !== id) {
        throw new Error(`Page with name "${data.name}" already exists`)
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
      updatedAt: string
    }> = {
      updatedAt: new Date().toISOString()
    }
    
    if (data.name !== undefined) updateData.name = data.name
    if (data.snapping !== undefined) updateData.snapping = data.snapping
    if (data.gridRows !== undefined) updateData.gridRows = data.gridRows
    if (data.gridCols !== undefined) updateData.gridCols = data.gridCols
    if (data.marginTop !== undefined) updateData.marginTop = data.marginTop
    if (data.marginRight !== undefined) updateData.marginRight = data.marginRight
    if (data.marginBottom !== undefined) updateData.marginBottom = data.marginBottom
    if (data.marginLeft !== undefined) updateData.marginLeft = data.marginLeft
    
    const [updated] = await this.db.update(schema.pages)
      .set(updateData)
      .where(eq(schema.pages.id, id))
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
    await this.db.transaction(async (tx) => {
      // Delete associated widgets first
      await tx.delete(schema.widgetInstance).where(eq(schema.widgetInstance.pageId, id))
      
      // Delete the page
      await tx.delete(schema.pages).where(eq(schema.pages.id, id))
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
    
    const [updated] = await this.db.update(schema.pages)
      .set({
        gridRows,
        gridCols,
        snapping,
        updatedAt: new Date().toISOString()
      })
      .where(eq(schema.pages.id, id))
      .returning()
    
    if (!updated) {
      throw new Error(`Page with id ${id} not found`)
    }
    
    return updated
  }
}

describe('PageRepository', () => {
  let repository: TestPageRepository
  let dashboardId: number

  beforeEach(async () => {
    repository = new TestPageRepository()
    
    // Set up test data
    const dashboard = await createTestDashboard()
    dashboardId = dashboard.id
  })

  describe('findById', () => {
    it('should return page when found', async () => {
      const testPage = await createTestPage(dashboardId, 'Test Page')
      
      const result = await repository.findById(testPage.id)
      
      expect(result).toBeDefined()
      expect(result?.id).toBe(testPage.id)
      expect(result?.name).toBe('Test Page')
      expect(result?.dashboardId).toBe(dashboardId)
    })

    it('should return null when page not found', async () => {
      const result = await repository.findById(999)
      
      expect(result).toBeNull()
    })
  })

  describe('findAll', () => {
    it('should return empty array when no pages exist', async () => {
      const result = await repository.findAll()
      
      expect(result).toEqual([])
    })

    it('should return all pages', async () => {
      const page1 = await createTestPage(dashboardId, 'Page 1')
      const page2 = await createTestPage(dashboardId, 'Page 2')
      
      const result = await repository.findAll()
      
      expect(result).toHaveLength(2)
      expect(result.map(p => p.id)).toContain(page1.id)
      expect(result.map(p => p.id)).toContain(page2.id)
    })
  })

  describe('findByDashboardId', () => {
    it('should return pages for specific dashboard', async () => {
      const page1 = await createTestPage(dashboardId, 'Page 1')
      
      // Create another dashboard with a page
      const dashboard2 = await createTestDashboard('Dashboard 2', false)
      const page2 = await createTestPage(dashboard2.id, 'Page 2')
      
      const result = await repository.findByDashboardId(dashboardId)
      
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(page1.id)
      expect(result[0].dashboardId).toBe(dashboardId)
    })

    it('should return empty array for dashboard with no pages', async () => {
      const result = await repository.findByDashboardId(dashboardId)
      
      expect(result).toEqual([])
    })
  })

  describe('findByName', () => {
    it('should return page when found by name', async () => {
      const testPage = await createTestPage(dashboardId, 'Unique Name')
      
      const result = await repository.findByName('Unique Name')
      
      expect(result).toBeDefined()
      expect(result?.id).toBe(testPage.id)
      expect(result?.name).toBe('Unique Name')
    })

    it('should return null when page not found by name', async () => {
      const result = await repository.findByName('Non-existent Page')
      
      expect(result).toBeNull()
    })
  })

  describe('findWithWidgets', () => {
    it('should return page with widgets', async () => {
      const testPage = await createTestPage(dashboardId, 'Page with Widgets')
      const widget1 = await createTestWidget(testPage.id, 'Clock')
      const widget2 = await createTestWidget(testPage.id, 'Weather')
      
      const result = await repository.findWithWidgets(testPage.id)
      
      expect(result).toBeDefined()
      expect(result?.id).toBe(testPage.id)
      expect(result?.name).toBe('Page with Widgets')
      expect(result?.widgets).toHaveLength(2)
      expect(result?.widgets.map(w => w.id)).toContain(widget1.id)
      expect(result?.widgets.map(w => w.id)).toContain(widget2.id)
    })

    it('should return page with empty widgets array when no widgets exist', async () => {
      const testPage = await createTestPage(dashboardId, 'Empty Page')
      
      const result = await repository.findWithWidgets(testPage.id)
      
      expect(result).toBeDefined()
      expect(result?.widgets).toEqual([])
    })

    it('should return null when page not found', async () => {
      const result = await repository.findWithWidgets(999)
      
      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create page with all properties', async () => {
      const createRequest: CreatePageRequest = {
        name: 'New Page',
        dashboardId,
        snapping: true,
        gridRows: 10,
        gridCols: 12,
        marginTop: 20,
        marginRight: 25,
        marginBottom: 30,
        marginLeft: 35
      }
      
      const result = await repository.create(createRequest)
      
      expect(result).toBeDefined()
      expect(result.name).toBe('New Page')
      expect(result.dashboardId).toBe(dashboardId)
      expect(result.snapping).toBe(true)
      expect(result.gridRows).toBe(10)
      expect(result.gridCols).toBe(12)
      expect(result.marginTop).toBe(20)
      expect(result.marginRight).toBe(25)
      expect(result.marginBottom).toBe(30)
      expect(result.marginLeft).toBe(35)
    })

    it('should create page with defaults when optional properties not provided', async () => {
      const createRequest: CreatePageRequest = {
        name: 'Minimal Page'
      }
      
      const result = await repository.create(createRequest)
      
      expect(result).toBeDefined()
      expect(result.name).toBe('Minimal Page')
      expect(result.dashboardId).toBeNull()
      expect(result.snapping).toBe(false)
      expect(result.gridRows).toBe(6)
      expect(result.gridCols).toBe(6)
      expect(result.marginTop).toBe(16)
      expect(result.marginRight).toBe(16)
      expect(result.marginBottom).toBe(16)
      expect(result.marginLeft).toBe(16)
    })

    it('should throw error when page name already exists', async () => {
      await createTestPage(dashboardId, 'Existing Page')
      
      const createRequest: CreatePageRequest = {
        name: 'Existing Page'
      }
      
      await expect(repository.create(createRequest)).rejects.toThrow(
        'Page with name "Existing Page" already exists'
      )
    })
  })

  describe('update', () => {
    it('should update page name', async () => {
      const testPage = await createTestPage(dashboardId, 'Original Name')
      
      const updateRequest: UpdatePageRequest = {
        id: testPage.id,
        name: 'Updated Name'
      }
      
      const result = await repository.update(testPage.id, updateRequest)
      
      expect(result).toBeDefined()
      expect(result.name).toBe('Updated Name')
      expect(result.id).toBe(testPage.id)
    })

    it('should update page grid settings', async () => {
      const testPage = await createTestPage(dashboardId, 'Grid Page')
      
      const updateRequest: UpdatePageRequest = {
        id: testPage.id,
        snapping: true,
        gridRows: 15,
        gridCols: 20
      }
      
      const result = await repository.update(testPage.id, updateRequest)
      
      expect(result).toBeDefined()
      expect(result.snapping).toBe(true)
      expect(result.gridRows).toBe(15)
      expect(result.gridCols).toBe(20)
    })

    it('should throw error when page not found', async () => {
      const updateRequest: UpdatePageRequest = {
        id: 999,
        name: 'Updated Name'
      }
      
      await expect(repository.update(999, updateRequest)).rejects.toThrow(
        'Page with id 999 not found'
      )
    })

    it('should throw error when new name conflicts with existing page', async () => {
      const page1 = await createTestPage(dashboardId, 'Page 1')
      const page2 = await createTestPage(dashboardId, 'Page 2')
      
      const updateRequest: UpdatePageRequest = {
        id: page2.id,
        name: 'Page 1' // Conflict with existing page
      }
      
      await expect(repository.update(page2.id, updateRequest)).rejects.toThrow(
        'Page with name "Page 1" already exists'
      )
    })
  })

  describe('delete', () => {
    it('should delete existing page and its widgets', async () => {
      const testPage = await createTestPage(dashboardId, 'Page to Delete')
      const widget = await createTestWidget(testPage.id, 'Clock')
      
      const result = await repository.delete(testPage.id)
      
      expect(result).toBe(true)
      
      // Verify page is deleted
      const deletedPage = await repository.findById(testPage.id)
      expect(deletedPage).toBeNull()
      
      // Verify widgets are deleted
      const widgets = await getTestDb().select().from(schema.widgetInstance).where(eq(schema.widgetInstance.pageId, testPage.id))
      expect(widgets).toHaveLength(0)
    })

    it('should return false when page does not exist', async () => {
      const result = await repository.delete(999)
      
      expect(result).toBe(false)
    })
  })

  describe('updateGridSettings', () => {
    it('should update grid settings', async () => {
      const testPage = await createTestPage(dashboardId, 'Grid Page')
      
      const result = await repository.updateGridSettings(testPage.id, 8, 10, true)
      
      expect(result).toBeDefined()
      expect(result.gridRows).toBe(8)
      expect(result.gridCols).toBe(10)
      expect(result.snapping).toBe(true)
    })

    it('should throw error when page not found', async () => {
      await expect(repository.updateGridSettings(999, 8, 10, true)).rejects.toThrow(
        'Page with id 999 not found'
      )
    })

    it('should validate grid rows bounds', async () => {
      const testPage = await createTestPage(dashboardId, 'Grid Page')
      
      await expect(repository.updateGridSettings(testPage.id, 0, 10, true)).rejects.toThrow(
        'Grid rows must be between 1 and 50'
      )
      
      await expect(repository.updateGridSettings(testPage.id, 51, 10, true)).rejects.toThrow(
        'Grid rows must be between 1 and 50'
      )
    })

    it('should validate grid columns bounds', async () => {
      const testPage = await createTestPage(dashboardId, 'Grid Page')
      
      await expect(repository.updateGridSettings(testPage.id, 10, 0, true)).rejects.toThrow(
        'Grid columns must be between 1 and 50'
      )
      
      await expect(repository.updateGridSettings(testPage.id, 10, 51, true)).rejects.toThrow(
        'Grid columns must be between 1 and 50'
      )
    })
  })
})