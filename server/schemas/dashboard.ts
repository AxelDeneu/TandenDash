import { z } from 'zod'

export const createDashboardSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  isDefault: z.boolean().optional().default(false)
})

export const updateDashboardSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  isDefault: z.boolean().optional()
})

export const duplicateDashboardSchema = z.object({
  name: z.string().min(1, 'Name is required')
})

export const dashboardSettingsSchema = z.object({
  locale: z.string().optional(),
  measurementSystem: z.enum(['metric', 'imperial']).optional(),
  temperatureUnit: z.enum(['celsius', 'fahrenheit']).optional(),
  timeFormat: z.enum(['24h', '12h']).optional(),
  dateFormat: z.string().optional(),
  timezone: z.string().optional(),
  theme: z.enum(['light', 'dark', 'auto']).optional()
})

export const dashboardQuerySchema = z.object({
  includePages: z.string().transform(val => val === 'true').optional()
})