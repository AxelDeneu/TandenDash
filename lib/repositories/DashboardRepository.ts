import { eq, and, desc } from 'drizzle-orm'
import { db, dashboards } from '../db'
import type { Dashboard, CreateDashboardRequest, UpdateDashboardRequest } from '@/types'

export interface IDashboardRepository {
  findAll(): Promise<Dashboard[]>
  findById(id: number): Promise<Dashboard | null>
  findByName(name: string): Promise<Dashboard | null>
  findDefault(): Promise<Dashboard | null>
  create(data: CreateDashboardRequest): Promise<Dashboard>
  update(id: number, data: UpdateDashboardRequest): Promise<Dashboard | null>
  delete(id: number): Promise<boolean>
  setDefault(id: number): Promise<boolean>
}

export class DashboardRepository implements IDashboardRepository {

  async findAll(): Promise<Dashboard[]> {
    return await db
      .select()
      .from(dashboards)
      .orderBy(desc(dashboards.isDefault), dashboards.name)
  }

  async findById(id: number): Promise<Dashboard | null> {
    const results = await db
      .select()
      .from(dashboards)
      .where(eq(dashboards.id, id))
      .limit(1)
    
    return results[0] || null
  }

  async findByName(name: string): Promise<Dashboard | null> {
    const results = await db
      .select()
      .from(dashboards)
      .where(eq(dashboards.name, name))
      .limit(1)
    
    return results[0] || null
  }

  async findDefault(): Promise<Dashboard | null> {
    const results = await db
      .select()
      .from(dashboards)
      .where(eq(dashboards.isDefault, true))
      .limit(1)
    
    return results[0] || null
  }

  async create(data: CreateDashboardRequest): Promise<Dashboard> {
    const { name, isDefault = false } = data

    // If this is set as default, unset any existing default
    if (isDefault) {
      await db
        .update(dashboards)
        .set({ isDefault: false })
        .where(eq(dashboards.isDefault, true))
    }

    const result = await db
      .insert(dashboards)
      .values({ name, isDefault })
      .returning()

    return result[0]
  }

  async update(id: number, data: UpdateDashboardRequest): Promise<Dashboard | null> {
    const { name, isDefault } = data
    const updateData: any = {}

    if (name !== undefined) updateData.name = name
    if (isDefault !== undefined) {
      updateData.isDefault = isDefault
      
      // If setting as default, unset any existing default
      if (isDefault) {
        await db
          .update(dashboards)
          .set({ isDefault: false })
          .where(and(eq(dashboards.isDefault, true), eq(dashboards.id, id).not()))
      }
    }

    // Add updatedAt
    updateData.updatedAt = new Date().toISOString()

    const result = await db
      .update(dashboards)
      .set(updateData)
      .where(eq(dashboards.id, id))
      .returning()

    return result[0] || null
  }

  async delete(id: number): Promise<boolean> {
    const result = await db
      .delete(dashboards)
      .where(eq(dashboards.id, id))
      .returning()

    return result.length > 0
  }

  async setDefault(id: number): Promise<boolean> {
    // First, unset any existing default
    await db
      .update(dashboards)
      .set({ isDefault: false })
      .where(eq(dashboards.isDefault, true))

    // Then set the new default
    const result = await db
      .update(dashboards)
      .set({ 
        isDefault: true,
        updatedAt: new Date().toISOString()
      })
      .where(eq(dashboards.id, id))
      .returning()

    return result.length > 0
  }
}