import { defineApiHandler } from '../utils/api-handler'
import { createApiResponse } from '../utils/response'

export default defineApiHandler(async ({ services }) => {
  const pageService = services.createPageService()
  const result = await pageService.getAllPages()
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch pages')
  }

  // Return data directly for backward compatibility
  return result.data || []
})