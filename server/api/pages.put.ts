import { defineApiHandler, getValidatedBody } from '../utils/api-handler'
import { createApiResponse } from '../utils/response'
import { z } from 'zod'

const updatePageSchema = z.object({
  id: z.number().int().positive('Page ID is required'),
  name: z.string().min(1, 'Name is required'),
  snapping: z.boolean().optional(),
  gridRows: z.number().int().min(1).max(20).optional(),
  gridCols: z.number().int().min(1).max(20).optional(),
  marginTop: z.number().int().min(0, 'Margin must be non-negative').max(200, 'Margin too large').optional(),
  marginRight: z.number().int().min(0, 'Margin must be non-negative').max(200, 'Margin too large').optional(),
  marginBottom: z.number().int().min(0, 'Margin must be non-negative').max(200, 'Margin too large').optional(),
  marginLeft: z.number().int().min(0, 'Margin must be non-negative').max(200, 'Margin too large').optional()
})

export default defineApiHandler(async ({ services, event }) => {
  const rawBody = await readBody(event)
  console.log('[pages.put] Raw body received:', JSON.stringify(rawBody))
  
  // Validate using Zod
  let validatedData
  try {
    validatedData = updatePageSchema.parse(rawBody)
    console.log('[pages.put] Schema validation passed:', JSON.stringify(validatedData))
  } catch (error) {
    console.error('[pages.put] Schema validation failed:', error)
    throw error
  }
  
  const pageService = services.createPageService()
  const { id, ...updateData } = validatedData
  console.log('[pages.put] Update data being sent to service:', JSON.stringify(updateData))
  console.log('[pages.put] Specifically, snapping value is:', updateData.snapping)
  
  const result = await pageService.updatePage(id, updateData)
  console.log('[pages.put] Service result:', JSON.stringify(result))
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to update page')
  }

  // Return data directly for backward compatibility
  return result.data
})