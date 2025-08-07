import { describe, it, expect, beforeEach, vi } from 'vitest'
import { eq, and, desc, ne } from 'drizzle-orm'
import { getTestDb, createTestDashboard } from '../helpers/db-helper'
import type { Dashboard, CreateDashboardRequest, UpdateDashboardRequest } from '@/types/dashboard'
import type { IDashboardRepository } from '@/lib/repositories/interfaces'
import * as schema from '@/lib/db'

// Test implementation of DashboardRepository using test database
class TestDashboardRepository implements IDashboardRepository {
  private get db() {
    return getTestDb()
  }

  async findAll(): Promise<Dashboard[]> {
    return await this.db
      .select()
      .from(schema.dashboards)
      .orderBy(desc(schema.dashboards.isDefault), schema.dashboards.name)
  }

  async findById(id: number): Promise<Dashboard | null> {
    const results = await this.db
      .select()
      .from(schema.dashboards)
      .where(eq(schema.dashboards.id, id))
      .limit(1)
    
    return results[0] || null
  }

  async findByName(name: string): Promise<Dashboard | null> {
    const results = await this.db
      .select()
      .from(schema.dashboards)
      .where(eq(schema.dashboards.name, name))
      .limit(1)
    
    return results[0] || null
  }

  async findDefault(): Promise<Dashboard | null> {
    const results = await this.db
      .select()
      .from(schema.dashboards)
      .where(eq(schema.dashboards.isDefault, true))
      .limit(1)
    
    return results[0] || null
  }

  async create(data: CreateDashboardRequest): Promise<Dashboard> {
    const { name, isDefault = false } = data

    // If this is set as default, unset any existing default
    if (isDefault) {
      await this.db
        .update(schema.dashboards)
        .set({ isDefault: false, updatedAt: new Date().toISOString() })
        .where(eq(schema.dashboards.isDefault, true))
    }

    const now = new Date().toISOString()
    const result = await this.db
      .insert(schema.dashboards)
      .values({ 
        name, 
        isDefault,
        createdAt: now,
        updatedAt: now
      })
      .returning()

    return result[0]
  }

  async update(id: number, data: UpdateDashboardRequest): Promise<Dashboard | null> {
    const { name, isDefault } = data
    const updateData: any = {
      updatedAt: new Date().toISOString()
    }

    if (name !== undefined) updateData.name = name
    if (isDefault !== undefined) {
      updateData.isDefault = isDefault
      
      // If setting as default, unset any existing default
      if (isDefault) {
        await this.db
          .update(schema.dashboards)
          .set({ isDefault: false, updatedAt: new Date().toISOString() })
          .where(and(eq(schema.dashboards.isDefault, true), ne(schema.dashboards.id, id)))
      }
    }

    const result = await this.db
      .update(schema.dashboards)
      .set(updateData)
      .where(eq(schema.dashboards.id, id))
      .returning()

    return result[0] || null
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db
      .delete(schema.dashboards)
      .where(eq(schema.dashboards.id, id))
      .returning()

    return result.length > 0
  }

  async setDefault(id: number): Promise<boolean> {
    const now = new Date().toISOString()
    
    // First, unset any existing default
    await this.db
      .update(schema.dashboards)
      .set({ isDefault: false, updatedAt: now })
      .where(eq(schema.dashboards.isDefault, true))

    // Then set the new default
    const result = await this.db
      .update(schema.dashboards)
      .set({ 
        isDefault: true,
        updatedAt: now
      })
      .where(eq(schema.dashboards.id, id))
      .returning()

    return result.length > 0
  }
}

describe('DashboardRepository', () => {
  let repository: TestDashboardRepository

  beforeEach(async () => {
    repository = new TestDashboardRepository()
  })

  describe('findAll', () => {
    it('should return empty array when no dashboards exist', async () => {
      const result = await repository.findAll()
      
      expect(result).toEqual([])
    })

    it('should return all dashboards ordered by default status then name', async () => {
      await createTestDashboard('Z Dashboard', false)
      await createTestDashboard('A Dashboard', true)
      await createTestDashboard('B Dashboard', false)
      
      const result = await repository.findAll()
      
      expect(result).toHaveLength(3)
      // Default dashboard should be first
      expect(result[0].name).toBe('A Dashboard')
      expect(result[0].isDefault).toBe(true)
      // Then non-default dashboards ordered by name
      expect(result[1].name).toBe('B Dashboard')
      expect(result[2].name).toBe('Z Dashboard')
    })
  })

  describe('findById', () => {
    it('should return dashboard when found', async () => {
      const testDashboard = await createTestDashboard('Test Dashboard')
      
      const result = await repository.findById(testDashboard.id)
      
      expect(result).toBeDefined()
      expect(result?.id).toBe(testDashboard.id)
      expect(result?.name).toBe('Test Dashboard')
    })

    it('should return null when dashboard not found', async () => {
      const result = await repository.findById(999)
      
      expect(result).toBeNull()
    })
  })

  describe('findByName', () => {
    it('should return dashboard when found by name', async () => {
      const testDashboard = await createTestDashboard('Unique Dashboard')
      
      const result = await repository.findByName('Unique Dashboard')
      
      expect(result).toBeDefined()
      expect(result?.id).toBe(testDashboard.id)
      expect(result?.name).toBe('Unique Dashboard')
    })

    it('should return null when dashboard not found by name', async () => {
      const result = await repository.findByName('Non-existent Dashboard')
      
      expect(result).toBeNull()
    })
  })

  describe('findDefault', () => {
    it('should return default dashboard when it exists', async () => {
      await createTestDashboard('Regular Dashboard', false)
      const defaultDashboard = await createTestDashboard('Default Dashboard', true)
      
      const result = await repository.findDefault()
      
      expect(result).toBeDefined()
      expect(result?.id).toBe(defaultDashboard.id)
      expect(result?.name).toBe('Default Dashboard')
      expect(result?.isDefault).toBe(true)
    })

    it('should return null when no default dashboard exists', async () => {
      await createTestDashboard('Regular Dashboard', false)
      
      const result = await repository.findDefault()
      
      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create dashboard with default values', async () => {
      const createRequest: CreateDashboardRequest = {
        name: 'New Dashboard'
      }
      
      const result = await repository.create(createRequest)
      
      expect(result).toBeDefined()
      expect(result.name).toBe('New Dashboard')
      expect(result.isDefault).toBe(false)
      expect(result.id).toBeGreaterThan(0)
    })

    it('should create dashboard as default', async () => {
      const createRequest: CreateDashboardRequest = {
        name: 'Default Dashboard',
        isDefault: true
      }
      
      const result = await repository.create(createRequest)
      
      expect(result).toBeDefined()
      expect(result.name).toBe('Default Dashboard')
      expect(result.isDefault).toBe(true)
    })

    it('should unset existing default when creating new default', async () => {
      const existingDefault = await createTestDashboard('Existing Default', true)
      
      const createRequest: CreateDashboardRequest = {
        name: 'New Default',
        isDefault: true
      }
      
      const newDefault = await repository.create(createRequest)
      
      // Check that new dashboard is default
      expect(newDefault.isDefault).toBe(true)
      
      // Check that old default is no longer default
      const oldDefault = await repository.findById(existingDefault.id)
      expect(oldDefault?.isDefault).toBe(false)
    })
  })

  describe('update', () => {
    it('should update dashboard name', async () => {
      const testDashboard = await createTestDashboard('Original Name')
      
      const updateRequest: UpdateDashboardRequest = {
        id: testDashboard.id,
        name: 'Updated Name'
      }
      
      const result = await repository.update(testDashboard.id, updateRequest)
      
      expect(result).toBeDefined()
      expect(result?.name).toBe('Updated Name')
      expect(result?.id).toBe(testDashboard.id)
    })

    it('should update dashboard to be default', async () => {
      const existingDefault = await createTestDashboard('Existing Default', true)
      const testDashboard = await createTestDashboard('Test Dashboard', false)
      
      const updateRequest: UpdateDashboardRequest = {
        id: testDashboard.id,
        isDefault: true
      }
      
      const result = await repository.update(testDashboard.id, updateRequest)
      
      expect(result).toBeDefined()
      expect(result?.isDefault).toBe(true)
      
      // Check that old default is no longer default
      const oldDefault = await repository.findById(existingDefault.id)
      expect(oldDefault?.isDefault).toBe(false)
    })

    it('should update dashboard to not be default', async () => {
      const testDashboard = await createTestDashboard('Test Dashboard', true)
      
      const updateRequest: UpdateDashboardRequest = {
        id: testDashboard.id,
        isDefault: false
      }
      
      const result = await repository.update(testDashboard.id, updateRequest)
      
      expect(result).toBeDefined()
      expect(result?.isDefault).toBe(false)
    })

    it('should return null when dashboard not found', async () => {
      const updateRequest: UpdateDashboardRequest = {
        id: 999,
        name: 'Updated Name'
      }
      
      const result = await repository.update(999, updateRequest)
      
      expect(result).toBeNull()
    })
  })

  describe('delete', () => {
    it('should delete existing dashboard', async () => {
      const testDashboard = await createTestDashboard('Dashboard to Delete')
      
      const result = await repository.delete(testDashboard.id)
      
      expect(result).toBe(true)
      
      // Verify dashboard is deleted
      const deletedDashboard = await repository.findById(testDashboard.id)
      expect(deletedDashboard).toBeNull()
    })

    it('should return false when dashboard does not exist', async () => {
      const result = await repository.delete(999)
      
      expect(result).toBe(false)
    })
  })

  describe('setDefault', () => {
    it('should set dashboard as default', async () => {
      const existingDefault = await createTestDashboard('Existing Default', true)
      const testDashboard = await createTestDashboard('New Default', false)
      
      const result = await repository.setDefault(testDashboard.id)
      
      expect(result).toBe(true)
      
      // Check that new dashboard is default
      const newDefault = await repository.findById(testDashboard.id)
      expect(newDefault?.isDefault).toBe(true)
      
      // Check that old default is no longer default
      const oldDefault = await repository.findById(existingDefault.id)
      expect(oldDefault?.isDefault).toBe(false)
    })

    it('should return false when dashboard does not exist', async () => {
      const result = await repository.setDefault(999)
      
      expect(result).toBe(false)
    })

    it('should handle case when no existing default', async () => {
      const testDashboard = await createTestDashboard('New Default', false)
      
      const result = await repository.setDefault(testDashboard.id)
      
      expect(result).toBe(true)
      
      // Check that dashboard is now default
      const updatedDashboard = await repository.findById(testDashboard.id)
      expect(updatedDashboard?.isDefault).toBe(true)
    })
  })
})