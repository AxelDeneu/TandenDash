import { eq } from 'drizzle-orm'
import { db, dashboardSettings } from '../db'
import type { DashboardSettings, UpdateDashboardSettingsRequest } from '@/types'

export interface IDashboardSettingsRepository {
  findByDashboardId(dashboardId: number): Promise<DashboardSettings | null>
  create(dashboardId: number, settings?: Partial<Omit<DashboardSettings, 'id' | 'dashboardId' | 'createdAt' | 'updatedAt'>>): Promise<DashboardSettings>
  update(dashboardId: number, data: Partial<UpdateDashboardSettingsRequest>): Promise<DashboardSettings | null>
  delete(dashboardId: number): Promise<boolean>
}

export class DashboardSettingsRepository implements IDashboardSettingsRepository {

  async findByDashboardId(dashboardId: number): Promise<DashboardSettings | null> {
    const results = await db
      .select()
      .from(dashboardSettings)
      .where(eq(dashboardSettings.dashboardId, dashboardId))
      .limit(1)
    
    return results[0] || null
  }

  async create(
    dashboardId: number, 
    settings?: Partial<Omit<DashboardSettings, 'id' | 'dashboardId' | 'createdAt' | 'updatedAt'>>
  ): Promise<DashboardSettings> {
    const defaultSettings = {
      locale: 'fr',
      measurementSystem: 'metric',
      temperatureUnit: 'celsius',
      timeFormat: '24h',
      dateFormat: 'DD/MM/YYYY',
      timezone: 'Europe/Paris',
      theme: 'auto'
    }

    const result = await db
      .insert(dashboardSettings)
      .values({
        dashboardId,
        ...defaultSettings,
        ...settings
      })
      .returning()

    return result[0]
  }

  async update(dashboardId: number, data: Partial<UpdateDashboardSettingsRequest>): Promise<DashboardSettings | null> {
    const updateData: any = {}

    // Only add fields that are provided
    if (data.locale !== undefined) updateData.locale = data.locale
    if (data.measurementSystem !== undefined) updateData.measurementSystem = data.measurementSystem
    if (data.temperatureUnit !== undefined) updateData.temperatureUnit = data.temperatureUnit
    if (data.timeFormat !== undefined) updateData.timeFormat = data.timeFormat
    if (data.dateFormat !== undefined) updateData.dateFormat = data.dateFormat
    if (data.timezone !== undefined) updateData.timezone = data.timezone
    if (data.theme !== undefined) updateData.theme = data.theme

    // Add updatedAt
    updateData.updatedAt = new Date().toISOString()

    const result = await db
      .update(dashboardSettings)
      .set(updateData)
      .where(eq(dashboardSettings.dashboardId, dashboardId))
      .returning()

    return result[0] || null
  }

  async delete(dashboardId: number): Promise<boolean> {
    const result = await db
      .delete(dashboardSettings)
      .where(eq(dashboardSettings.dashboardId, dashboardId))
      .returning()

    return result.length > 0
  }
}