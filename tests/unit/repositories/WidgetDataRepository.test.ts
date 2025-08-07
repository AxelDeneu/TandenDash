import { describe, it, expect, beforeEach, vi } from 'vitest'
import { eq, and } from 'drizzle-orm'
import { getTestDb, createTestDashboard, createTestPage, createTestWidget, createTestWidgetData } from '../helpers/db-helper'
import type { IWidgetDataRepository } from '@/lib/repositories/interfaces'
import * as schema from '@/lib/db'

// Mock console.error to reduce noise in tests
vi.spyOn(console, 'error').mockImplementation(() => {})

// Widget data types (matching the repository)
export interface WidgetData {
  id: number
  widgetInstanceId: number
  key: string
  value: string // JSON string
  createdAt: string
  updatedAt: string
}

export interface CreateWidgetDataRequest {
  widgetInstanceId: number
  key: string
  value: string
}

export interface UpdateWidgetDataRequest {
  value: string
}

// Test implementation of WidgetDataRepository using test database
class TestWidgetDataRepository implements IWidgetDataRepository {
  private get db() {
    return getTestDb()
  }

  async findByWidgetInstanceId(widgetInstanceId: number): Promise<WidgetData[]> {
    const results = await this.db
      .select()
      .from(schema.widgetData)
      .where(eq(schema.widgetData.widgetInstanceId, widgetInstanceId))
    
    return results as WidgetData[]
  }

  async findByKey(widgetInstanceId: number, key: string): Promise<WidgetData | null> {
    const [result] = await this.db
      .select()
      .from(schema.widgetData)
      .where(
        and(
          eq(schema.widgetData.widgetInstanceId, widgetInstanceId),
          eq(schema.widgetData.key, key)
        )
      )
      .limit(1)
    
    return result ? (result as WidgetData) : null
  }

  async create(data: CreateWidgetDataRequest): Promise<WidgetData> {
    const now = new Date().toISOString()
    const [result] = await this.db
      .insert(schema.widgetData)
      .values({
        widgetInstanceId: data.widgetInstanceId,
        key: data.key,
        value: data.value,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
    
    return result as WidgetData
  }

  async update(widgetInstanceId: number, key: string, data: UpdateWidgetDataRequest): Promise<WidgetData> {
    const [result] = await this.db
      .update(schema.widgetData)
      .set({
        value: data.value,
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(schema.widgetData.widgetInstanceId, widgetInstanceId),
          eq(schema.widgetData.key, key)
        )
      )
      .returning()
    
    if (!result) {
      throw new Error('Widget data not found')
    }
    
    return result as WidgetData
  }

  async upsert(data: CreateWidgetDataRequest): Promise<WidgetData> {
    const existing = await this.findByKey(data.widgetInstanceId, data.key)
    
    if (existing) {
      return this.update(data.widgetInstanceId, data.key, { value: data.value })
    } else {
      return this.create(data)
    }
  }

  async delete(widgetInstanceId: number, key: string): Promise<boolean> {
    const result = await this.db
      .delete(schema.widgetData)
      .where(
        and(
          eq(schema.widgetData.widgetInstanceId, widgetInstanceId),
          eq(schema.widgetData.key, key)
        )
      )
    
    return result.changes > 0
  }

  async deleteAll(widgetInstanceId: number): Promise<boolean> {
    await this.db
      .delete(schema.widgetData)
      .where(eq(schema.widgetData.widgetInstanceId, widgetInstanceId))
    
    return true
  }
}

describe('WidgetDataRepository', () => {
  let repository: TestWidgetDataRepository
  let dashboardId: number
  let pageId: number
  let widgetId: number

  beforeEach(async () => {
    repository = new TestWidgetDataRepository()
    
    // Set up test data
    const dashboard = await createTestDashboard()
    dashboardId = dashboard.id
    
    const page = await createTestPage(dashboardId)
    pageId = page.id
    
    const widget = await createTestWidget(pageId, 'Clock')
    widgetId = widget.id
  })

  describe('findByWidgetInstanceId', () => {
    it('should return empty array when no widget data exists', async () => {
      const result = await repository.findByWidgetInstanceId(widgetId)
      
      expect(result).toEqual([])
    })

    it('should return all widget data for instance', async () => {
      const data1 = await createTestWidgetData(widgetId, 'setting1', { value: 'test1' })
      const data2 = await createTestWidgetData(widgetId, 'setting2', { value: 'test2' })
      
      const result = await repository.findByWidgetInstanceId(widgetId)
      
      expect(result).toHaveLength(2)
      expect(result.map(d => d.key)).toContain('setting1')
      expect(result.map(d => d.key)).toContain('setting2')
    })

    it('should only return data for the specified widget instance', async () => {
      const widget2 = await createTestWidget(pageId, 'Weather')
      await createTestWidgetData(widgetId, 'setting1', { value: 'test1' })
      await createTestWidgetData(widget2.id, 'setting2', { value: 'test2' })
      
      const result = await repository.findByWidgetInstanceId(widgetId)
      
      expect(result).toHaveLength(1)
      expect(result[0].key).toBe('setting1')
      expect(result[0].widgetInstanceId).toBe(widgetId)
    })
  })

  describe('findByKey', () => {
    it('should return widget data when found by key', async () => {
      const testData = await createTestWidgetData(widgetId, 'testKey', { value: 'testValue' })
      
      const result = await repository.findByKey(widgetId, 'testKey')
      
      expect(result).toBeDefined()
      expect(result?.id).toBe(testData.id)
      expect(result?.key).toBe('testKey')
      expect(result?.widgetInstanceId).toBe(widgetId)
    })

    it('should return null when key not found', async () => {
      const result = await repository.findByKey(widgetId, 'nonExistentKey')
      
      expect(result).toBeNull()
    })

    it('should return null when widget instance does not exist', async () => {
      const result = await repository.findByKey(999, 'someKey')
      
      expect(result).toBeNull()
    })

    it('should only return data for the correct widget instance and key combination', async () => {
      const widget2 = await createTestWidget(pageId, 'Weather')
      await createTestWidgetData(widgetId, 'sharedKey', { value: 'widget1Value' })
      await createTestWidgetData(widget2.id, 'sharedKey', { value: 'widget2Value' })
      
      const result = await repository.findByKey(widgetId, 'sharedKey')
      
      expect(result).toBeDefined()
      expect(result?.widgetInstanceId).toBe(widgetId)
      expect(JSON.parse(result!.value)).toEqual({ value: 'widget1Value' })
    })
  })

  describe('create', () => {
    it('should create new widget data', async () => {
      const createRequest: CreateWidgetDataRequest = {
        widgetInstanceId: widgetId,
        key: 'newSetting',
        value: JSON.stringify({ setting: 'value', number: 42 })
      }
      
      const result = await repository.create(createRequest)
      
      expect(result).toBeDefined()
      expect(result.widgetInstanceId).toBe(widgetId)
      expect(result.key).toBe('newSetting')
      expect(result.value).toBe(JSON.stringify({ setting: 'value', number: 42 }))
      expect(result.id).toBeGreaterThan(0)
    })

    it('should create widget data with simple string value', async () => {
      const createRequest: CreateWidgetDataRequest = {
        widgetInstanceId: widgetId,
        key: 'simpleKey',
        value: 'simple string value'
      }
      
      const result = await repository.create(createRequest)
      
      expect(result).toBeDefined()
      expect(result.value).toBe('simple string value')
    })
  })

  describe('update', () => {
    it('should update existing widget data', async () => {
      const testData = await createTestWidgetData(widgetId, 'updateKey', { original: 'value' })
      
      const updateRequest: UpdateWidgetDataRequest = {
        value: JSON.stringify({ updated: 'value', modified: true })
      }
      
      const result = await repository.update(widgetId, 'updateKey', updateRequest)
      
      expect(result).toBeDefined()
      expect(result.id).toBe(testData.id)
      expect(result.value).toBe(JSON.stringify({ updated: 'value', modified: true }))
    })

    it('should throw error when widget data not found', async () => {
      const updateRequest: UpdateWidgetDataRequest = {
        value: 'updated value'
      }
      
      await expect(repository.update(widgetId, 'nonExistentKey', updateRequest)).rejects.toThrow(
        'Widget data not found'
      )
    })

    it('should throw error when widget instance does not exist', async () => {
      const updateRequest: UpdateWidgetDataRequest = {
        value: 'updated value'
      }
      
      await expect(repository.update(999, 'someKey', updateRequest)).rejects.toThrow(
        'Widget data not found'
      )
    })
  })

  describe('upsert', () => {
    it('should create new widget data when it does not exist', async () => {
      const upsertRequest: CreateWidgetDataRequest = {
        widgetInstanceId: widgetId,
        key: 'newUpsertKey',
        value: JSON.stringify({ created: true })
      }
      
      const result = await repository.upsert(upsertRequest)
      
      expect(result).toBeDefined()
      expect(result.key).toBe('newUpsertKey')
      expect(result.value).toBe(JSON.stringify({ created: true }))
      expect(result.id).toBeGreaterThan(0)
    })

    it('should update existing widget data when it exists', async () => {
      const testData = await createTestWidgetData(widgetId, 'existingKey', { original: 'value' })
      
      const upsertRequest: CreateWidgetDataRequest = {
        widgetInstanceId: widgetId,
        key: 'existingKey',
        value: JSON.stringify({ updated: 'value' })
      }
      
      const result = await repository.upsert(upsertRequest)
      
      expect(result).toBeDefined()
      expect(result.id).toBe(testData.id) // Same ID, so it was updated
      expect(result.value).toBe(JSON.stringify({ updated: 'value' }))
    })

    it('should handle multiple upserts correctly', async () => {
      const key = 'multiUpsertKey'
      
      // First upsert (create)
      const firstResult = await repository.upsert({
        widgetInstanceId: widgetId,
        key,
        value: JSON.stringify({ version: 1 })
      })
      
      // Second upsert (update)
      const secondResult = await repository.upsert({
        widgetInstanceId: widgetId,
        key,
        value: JSON.stringify({ version: 2 })
      })
      
      expect(firstResult.id).toBe(secondResult.id)
      expect(secondResult.value).toBe(JSON.stringify({ version: 2 }))
    })
  })

  describe('delete', () => {
    it('should delete existing widget data', async () => {
      await createTestWidgetData(widgetId, 'deleteKey', { toDelete: true })
      
      const result = await repository.delete(widgetId, 'deleteKey')
      
      expect(result).toBe(true)
      
      // Verify data is deleted
      const deletedData = await repository.findByKey(widgetId, 'deleteKey')
      expect(deletedData).toBeNull()
    })

    it('should return false when widget data does not exist', async () => {
      const result = await repository.delete(widgetId, 'nonExistentKey')
      
      expect(result).toBe(false)
    })

    it('should only delete the specific key for the widget instance', async () => {
      await createTestWidgetData(widgetId, 'keepKey', { keep: true })
      await createTestWidgetData(widgetId, 'deleteKey', { delete: true })
      
      const result = await repository.delete(widgetId, 'deleteKey')
      
      expect(result).toBe(true)
      
      // Verify correct data is deleted and other remains
      const deletedData = await repository.findByKey(widgetId, 'deleteKey')
      const keptData = await repository.findByKey(widgetId, 'keepKey')
      
      expect(deletedData).toBeNull()
      expect(keptData).toBeDefined()
    })
  })

  describe('deleteAll', () => {
    it('should delete all widget data for instance', async () => {
      await createTestWidgetData(widgetId, 'key1', { data: 1 })
      await createTestWidgetData(widgetId, 'key2', { data: 2 })
      await createTestWidgetData(widgetId, 'key3', { data: 3 })
      
      const result = await repository.deleteAll(widgetId)
      
      expect(result).toBe(true)
      
      // Verify all data is deleted
      const remainingData = await repository.findByWidgetInstanceId(widgetId)
      expect(remainingData).toHaveLength(0)
    })

    it('should only delete data for the specified widget instance', async () => {
      const widget2 = await createTestWidget(pageId, 'Weather')
      
      await createTestWidgetData(widgetId, 'key1', { widget: 1 })
      await createTestWidgetData(widget2.id, 'key2', { widget: 2 })
      
      const result = await repository.deleteAll(widgetId)
      
      expect(result).toBe(true)
      
      // Verify only data for first widget is deleted
      const widget1Data = await repository.findByWidgetInstanceId(widgetId)
      const widget2Data = await repository.findByWidgetInstanceId(widget2.id)
      
      expect(widget1Data).toHaveLength(0)
      expect(widget2Data).toHaveLength(1)
    })

    it('should return true even when no data exists', async () => {
      const result = await repository.deleteAll(widgetId)
      
      expect(result).toBe(true)
    })
  })
})