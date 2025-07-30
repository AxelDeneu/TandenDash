import { z } from 'zod'

// Common ID schemas
export const numericIdSchema = z.string().transform((val) => {
  const num = parseInt(val, 10)
  if (isNaN(num)) {
    throw new Error('Invalid numeric ID')
  }
  return num
})

export const optionalNumericIdSchema = z.string().transform((val) => {
  const num = parseInt(val, 10)
  if (isNaN(num)) {
    throw new Error('Invalid numeric ID')
  }
  return num
}).optional()

// Common position schema
export const widgetPositionSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number().min(50),
  height: z.number().min(50)
})

// Pagination schemas
export const paginationQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('asc')
})

// Common response schemas
export const apiErrorSchema = z.object({
  statusCode: z.number(),
  statusMessage: z.string(),
  data: z.any().optional()
})

export const apiSuccessSchema = <T extends z.ZodType>(dataSchema: T) => z.object({
  success: z.literal(true),
  data: dataSchema
})

export const apiListResponseSchema = <T extends z.ZodType>(itemSchema: T) => z.object({
  success: z.literal(true),
  data: z.array(itemSchema),
  total: z.number().optional(),
  page: z.number().optional(),
  limit: z.number().optional()
})