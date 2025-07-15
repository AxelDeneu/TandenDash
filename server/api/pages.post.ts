import { defineApiHandler, getValidatedBody } from '../utils/api-handler'
import { createApiResponse } from '../utils/response'
import { z } from 'zod'

const createPageSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  snapping: z.boolean().optional().default(false),
  gridRows: z.number().int().min(1).max(20).optional().default(6),
  gridCols: z.number().int().min(1).max(20).optional().default(6),
  marginTop: z.number().int().min(0, 'Margin must be non-negative').max(200, 'Margin too large').optional().default(0),
  marginRight: z.number().int().min(0, 'Margin must be non-negative').max(200, 'Margin too large').optional().default(0),
  marginBottom: z.number().int().min(0, 'Margin must be non-negative').max(200, 'Margin too large').optional().default(0),
  marginLeft: z.number().int().min(0, 'Margin must be non-negative').max(200, 'Margin too large').optional().default(0)
})

export default defineApiHandler(async ({ services, event }) => {
  const body = await getValidatedBody(event, (data) => createPageSchema.parse(data))
  
  const pageService = services.createPageService()
  const result = await pageService.createPage(body)
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to create page')
  }

  // Return data directly for backward compatibility
  return result.data
})