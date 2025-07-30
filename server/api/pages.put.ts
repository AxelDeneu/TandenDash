import { defineApiHandler, getValidatedBody } from '../utils/api-handler'
import { updatePageWithIdSchema } from '../schemas'

export default defineApiHandler(async ({ services, event }) => {
  const body = await getValidatedBody(event, (data) => updatePageWithIdSchema.parse(data))
  
  const pageService = services.createPageService()
  const result = await pageService.updatePage(body.id, body)
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to update page')
  }

  // Return data directly for backward compatibility
  return result.data
})