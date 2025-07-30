import { z } from 'zod'
import { widgetPositionSchema } from './common'

export const createWidgetSchema = z.object({
  type: z.string().min(1, 'Widget type is required'),
  position: widgetPositionSchema,
  pageId: z.number().int().positive(),
  options: z.record(z.unknown()).optional().default({})
})

export const updateWidgetSchema = z.object({
  id: z.number().int().positive(),
  position: widgetPositionSchema.optional(),
  options: z.record(z.any()).optional()
})

export const deleteWidgetSchema = z.object({
  id: z.number().int().positive()
})

export const widgetQuerySchema = z.object({
  pageId: z.string().transform(val => parseInt(val, 10)).optional()
})

export const widgetDataKeySchema = z.string().min(1, 'Data key is required')

export const widgetDataValueSchema = z.any()

export const widgetDataBatchSchema = z.object({
  data: z.record(z.string(), z.any())
})