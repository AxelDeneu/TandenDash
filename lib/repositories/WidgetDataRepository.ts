import { db, widgetData } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import type { IWidgetDataRepository } from './interfaces'

// Schema validation
const WidgetDataSchema = z.object({
  id: z.number().optional(),
  widgetInstanceId: z.number(),
  key: z.string().min(1),
  value: z.string(), // JSON string
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})

const CreateWidgetDataSchema = WidgetDataSchema.omit({ id: true, createdAt: true, updatedAt: true })
const UpdateWidgetDataSchema = z.object({
  value: z.string(),
})

export type WidgetData = z.infer<typeof WidgetDataSchema>
export type CreateWidgetDataRequest = z.infer<typeof CreateWidgetDataSchema>
export type UpdateWidgetDataRequest = z.infer<typeof UpdateWidgetDataSchema>

export class WidgetDataRepository implements IWidgetDataRepository {
  async findByWidgetInstanceId(widgetInstanceId: number): Promise<WidgetData[]> {
    try {
      const results = await db
        .select()
        .from(widgetData)
        .where(eq(widgetData.widgetInstanceId, widgetInstanceId))
      
      return results.map(result => WidgetDataSchema.parse(result))
    } catch (error) {
      console.error('Error fetching widget data:', error)
      throw new Error('Failed to fetch widget data')
    }
  }

  async findByKey(widgetInstanceId: number, key: string): Promise<WidgetData | null> {
    try {
      const [result] = await db
        .select()
        .from(widgetData)
        .where(
          and(
            eq(widgetData.widgetInstanceId, widgetInstanceId),
            eq(widgetData.key, key)
          )
        )
        .limit(1)
      
      return result ? WidgetDataSchema.parse(result) : null
    } catch (error) {
      console.error('Error fetching widget data by key:', error)
      throw new Error('Failed to fetch widget data')
    }
  }

  async create(data: CreateWidgetDataRequest): Promise<WidgetData> {
    try {
      const validated = CreateWidgetDataSchema.parse(data)
      
      const [result] = await db
        .insert(widgetData)
        .values({
          widgetInstanceId: validated.widgetInstanceId,
          key: validated.key,
          value: validated.value,
        })
        .returning()
      
      return WidgetDataSchema.parse(result)
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`)
      }
      console.error('Error creating widget data:', error)
      throw new Error('Failed to create widget data')
    }
  }

  async update(widgetInstanceId: number, key: string, data: UpdateWidgetDataRequest): Promise<WidgetData> {
    try {
      const validated = UpdateWidgetDataSchema.parse(data)
      
      const [result] = await db
        .update(widgetData)
        .set({
          value: validated.value,
          updatedAt: new Date().toISOString(),
        })
        .where(
          and(
            eq(widgetData.widgetInstanceId, widgetInstanceId),
            eq(widgetData.key, key)
          )
        )
        .returning()
      
      if (!result) {
        throw new Error('Widget data not found')
      }
      
      return WidgetDataSchema.parse(result)
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`)
      }
      console.error('Error updating widget data:', error)
      throw new Error('Failed to update widget data')
    }
  }

  async upsert(data: CreateWidgetDataRequest): Promise<WidgetData> {
    try {
      const existing = await this.findByKey(data.widgetInstanceId, data.key)
      
      if (existing) {
        return this.update(data.widgetInstanceId, data.key, { value: data.value })
      } else {
        return this.create(data)
      }
    } catch (error) {
      console.error('Error upserting widget data:', error)
      throw new Error('Failed to upsert widget data')
    }
  }

  async delete(widgetInstanceId: number, key: string): Promise<boolean> {
    try {
      const result = await db
        .delete(widgetData)
        .where(
          and(
            eq(widgetData.widgetInstanceId, widgetInstanceId),
            eq(widgetData.key, key)
          )
        )
      
      return true
    } catch (error) {
      console.error('Error deleting widget data:', error)
      throw new Error('Failed to delete widget data')
    }
  }

  async deleteAll(widgetInstanceId: number): Promise<boolean> {
    try {
      await db
        .delete(widgetData)
        .where(eq(widgetData.widgetInstanceId, widgetInstanceId))
      
      return true
    } catch (error) {
      console.error('Error deleting all widget data:', error)
      throw new Error('Failed to delete all widget data')
    }
  }
}