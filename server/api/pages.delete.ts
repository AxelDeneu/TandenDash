import { defineApiHandler, getValidatedBody } from '../utils/api-handler'
import { deletePageSchema } from '../schemas'

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