import { defineApiHandler, getValidatedBody } from '../utils/api-handler'
import { createApiResponse } from '../utils/response'
import { z } from 'zod'

const deletePageSchema = z.object({
  id: z.number().int().positive('Page ID is required')
})

export default defineApiHandler(async ({ services, event }) => {
  const body = await getValidatedBody(event, (data) => deletePageSchema.parse(data))
  
  const pageService = services.createPageService()
  const result = await pageService.deletePage(body.id)
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to delete page')
  }

  // Return data directly for backward compatibility
  return { success: result.data }
})