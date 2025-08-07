import { describe, it, expect, beforeEach, vi } from 'vitest'
import { eq } from 'drizzle-orm'
import { getTestDb, createTestDashboard } from '../helpers/db-helper'
import type { DashboardSettings, UpdateDashboardSettingsRequest } from '@/types/dashboard'
import type { IDashboardSettingsRepository } from '@/lib/repositories/interfaces'
import * as schema from '@/lib/db'

// Test implementation of DashboardSettingsRepository using test database
class TestDashboardSettingsRepository implements IDashboardSettingsRepository {
  private get db() {
    return getTestDb()
  }

  async findByDashboardId(dashboardId: number): Promise<DashboardSettings | null> {
    const results = await this.db
      .select()
      .from(schema.dashboardSettings)
      .where(eq(schema.dashboardSettings.dashboardId, dashboardId))
      .limit(1)
    
    return results[0] || null
  }

  async create(
    dashboardId: number, 
    settings?: Partial<Omit<DashboardSettings, 'id' | 'dashboardId' | 'createdAt' | 'updatedAt'>>
  ): Promise<DashboardSettings> {
    const defaultSettings = {
      locale: 'fr',
      measurementSystem: 'metric' as const,
      temperatureUnit: 'celsius' as const,
      timeFormat: '24h' as const,
      dateFormat: 'DD/MM/YYYY',
      timezone: 'Europe/Paris',
      theme: 'auto' as const
    }

    const now = new Date().toISOString()
    const result = await this.db
      .insert(schema.dashboardSettings)
      .values({
        dashboardId,
        ...defaultSettings,
        ...settings,
        createdAt: now,
        updatedAt: now
      })
      .returning()

    return result[0]
  }

  async update(dashboardId: number, data: Partial<UpdateDashboardSettingsRequest>): Promise<DashboardSettings | null> {
    const updateData: any = {
      updatedAt: new Date().toISOString()
    }

    // Only add fields that are provided
    if (data.locale !== undefined) updateData.locale = data.locale
    if (data.measurementSystem !== undefined) updateData.measurementSystem = data.measurementSystem
    if (data.temperatureUnit !== undefined) updateData.temperatureUnit = data.temperatureUnit
    if (data.timeFormat !== undefined) updateData.timeFormat = data.timeFormat
    if (data.dateFormat !== undefined) updateData.dateFormat = data.dateFormat
    if (data.timezone !== undefined) updateData.timezone = data.timezone
    if (data.theme !== undefined) updateData.theme = data.theme

    const result = await this.db
      .update(schema.dashboardSettings)
      .set(updateData)
      .where(eq(schema.dashboardSettings.dashboardId, dashboardId))
      .returning()

    return result[0] || null
  }

  async delete(dashboardId: number): Promise<boolean> {
    const result = await this.db
      .delete(schema.dashboardSettings)
      .where(eq(schema.dashboardSettings.dashboardId, dashboardId))
      .returning()

    return result.length > 0
  }
}

describe('DashboardSettingsRepository', () => {
  let repository: TestDashboardSettingsRepository
  let dashboardId: number

  beforeEach(async () => {
    repository = new TestDashboardSettingsRepository()
    
    // Set up test data
    const dashboard = await createTestDashboard()
    dashboardId = dashboard.id
  })

  describe('findByDashboardId', () => {
    it('should return settings when found', async () => {
      const createdSettings = await repository.create(dashboardId)
      
      const result = await repository.findByDashboardId(dashboardId)
      
      expect(result).toBeDefined()
      expect(result?.id).toBe(createdSettings.id)
      expect(result?.dashboardId).toBe(dashboardId)
      expect(result?.locale).toBe('fr')
    })

    it('should return null when settings not found', async () => {
      const result = await repository.findByDashboardId(999)
      
      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create settings with default values', async () => {
      const result = await repository.create(dashboardId)
      
      expect(result).toBeDefined()
      expect(result.dashboardId).toBe(dashboardId)
      expect(result.locale).toBe('fr')
      expect(result.measurementSystem).toBe('metric')
      expect(result.temperatureUnit).toBe('celsius')
      expect(result.timeFormat).toBe('24h')
      expect(result.dateFormat).toBe('DD/MM/YYYY')
      expect(result.timezone).toBe('Europe/Paris')
      expect(result.theme).toBe('auto')
      expect(result.id).toBeGreaterThan(0)
    })

    it('should create settings with custom values', async () => {
      const customSettings = {
        locale: 'en',
        measurementSystem: 'imperial' as const,
        temperatureUnit: 'fahrenheit' as const,
        timeFormat: '12h' as const,
        dateFormat: 'MM/DD/YYYY',
        timezone: 'America/New_York',
        theme: 'dark' as const
      }
      
      const result = await repository.create(dashboardId, customSettings)
      
      expect(result).toBeDefined()
      expect(result.dashboardId).toBe(dashboardId)
      expect(result.locale).toBe('en')
      expect(result.measurementSystem).toBe('imperial')
      expect(result.temperatureUnit).toBe('fahrenheit')
      expect(result.timeFormat).toBe('12h')
      expect(result.dateFormat).toBe('MM/DD/YYYY')
      expect(result.timezone).toBe('America/New_York')
      expect(result.theme).toBe('dark')
    })

    it('should merge custom settings with defaults', async () => {
      const partialSettings = {
        locale: 'en',
        theme: 'light' as const
      }
      
      const result = await repository.create(dashboardId, partialSettings)
      
      expect(result).toBeDefined()
      expect(result.locale).toBe('en') // Custom value
      expect(result.theme).toBe('light') // Custom value
      expect(result.measurementSystem).toBe('metric') // Default value
      expect(result.temperatureUnit).toBe('celsius') // Default value
    })
  })

  describe('update', () => {
    it('should update single setting', async () => {
      const createdSettings = await repository.create(dashboardId)
      
      const updateData: Partial<UpdateDashboardSettingsRequest> = {
        locale: 'en'
      }
      
      const result = await repository.update(dashboardId, updateData)
      
      expect(result).toBeDefined()
      expect(result?.locale).toBe('en')
      expect(result?.measurementSystem).toBe('metric') // Unchanged
    })

    it('should update multiple settings', async () => {
      await repository.create(dashboardId)
      
      const updateData: Partial<UpdateDashboardSettingsRequest> = {
        locale: 'es',
        measurementSystem: 'imperial',
        temperatureUnit: 'fahrenheit',
        timeFormat: '12h',
        theme: 'dark'
      }
      
      const result = await repository.update(dashboardId, updateData)
      
      expect(result).toBeDefined()
      expect(result?.locale).toBe('es')
      expect(result?.measurementSystem).toBe('imperial')
      expect(result?.temperatureUnit).toBe('fahrenheit')
      expect(result?.timeFormat).toBe('12h')
      expect(result?.theme).toBe('dark')
    })

    it('should update timezone and date format', async () => {
      await repository.create(dashboardId)
      
      const updateData: Partial<UpdateDashboardSettingsRequest> = {
        timezone: 'Asia/Tokyo',
        dateFormat: 'YYYY-MM-DD'
      }
      
      const result = await repository.update(dashboardId, updateData)
      
      expect(result).toBeDefined()
      expect(result?.timezone).toBe('Asia/Tokyo')
      expect(result?.dateFormat).toBe('YYYY-MM-DD')
    })

    it('should return null when dashboard settings not found', async () => {
      const updateData: Partial<UpdateDashboardSettingsRequest> = {
        locale: 'en'
      }
      
      const result = await repository.update(999, updateData)
      
      expect(result).toBeNull()
    })

    it('should handle empty update data', async () => {
      const createdSettings = await repository.create(dashboardId)
      
      const result = await repository.update(dashboardId, {})
      
      expect(result).toBeDefined()
      expect(result?.id).toBe(createdSettings.id)
      // All original values should be preserved
      expect(result?.locale).toBe('fr')
      expect(result?.measurementSystem).toBe('metric')
    })
  })

  describe('delete', () => {
    it('should delete existing settings', async () => {
      await repository.create(dashboardId)
      
      const result = await repository.delete(dashboardId)
      
      expect(result).toBe(true)
      
      // Verify settings are deleted
      const deletedSettings = await repository.findByDashboardId(dashboardId)
      expect(deletedSettings).toBeNull()
    })

    it('should return false when settings do not exist', async () => {
      const result = await repository.delete(999)
      
      expect(result).toBe(false)
    })
  })
})