import { defineApiHandler, getValidatedBody } from '../utils/api-handler'
import { deleteWidgetSchema } from '../schemas'

export default defineApiHandler(async ({ services, event }) => {
  const body = await getValidatedBody(event, (data) => deleteWidgetSchema.parse(data))
  
  const widgetService = services.createWidgetService()
  const result = await widgetService.deleteWidget(body.id)
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to delete widget')
  }
  
  return { success: true }
}) 