import { z } from 'zod'

export const createPageSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  dashboardId: z.number().optional(),
  snapping: z.boolean().optional().default(false),
  gridRows: z.number().int().min(1).max(20).optional().default(6),
  gridCols: z.number().int().min(1).max(20).optional().default(6),
  marginTop: z.number().int().min(0, 'Margin must be non-negative').max(200, 'Margin too large').optional().default(0),
  marginRight: z.number().int().min(0, 'Margin must be non-negative').max(200, 'Margin too large').optional().default(0),
  marginBottom: z.number().int().min(0, 'Margin must be non-negative').max(200, 'Margin too large').optional().default(0),
  marginLeft: z.number().int().min(0, 'Margin must be non-negative').max(200, 'Margin too large').optional().default(0)
})

export const updatePageSchema = z.object({
  name: z.string().min(1).optional(),
  snapping: z.boolean().optional(),
  gridRows: z.number().int().min(1).max(20).optional(),
  gridCols: z.number().int().min(1).max(20).optional(),
  marginTop: z.number().int().min(0).max(200).optional(),
  marginRight: z.number().int().min(0).max(200).optional(),
  marginBottom: z.number().int().min(0).max(200).optional(),
  marginLeft: z.number().int().min(0).max(200).optional()
})

export const updatePageWithIdSchema = z.object({
  id: z.number().int().positive('Page ID is required'),
  name: z.string().min(1, 'Name is required'),
  snapping: z.boolean().optional(),
  gridRows: z.number().int().min(1).max(20).optional(),
  gridCols: z.number().int().min(1).max(20).optional(),
  marginTop: z.number().int().min(0).max(200).optional(),
  marginRight: z.number().int().min(0).max(200).optional(),
  marginBottom: z.number().int().min(0).max(200).optional(),
  marginLeft: z.number().int().min(0).max(200).optional()
})

export const deletePageSchema = z.object({
  id: z.number().int().positive('Page ID is required')
})