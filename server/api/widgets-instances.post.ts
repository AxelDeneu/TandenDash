import { defineApiHandler, getValidatedBody } from '../utils/api-handler'
import { createWidgetSchema } from '../schemas'

export default defineApiHandler(async ({ services, event }) => {
  const body = await getValidatedBody(event, (data) => createWidgetSchema.parse(data))
  
  const widgetService = services.createWidgetService()
  const result = await widgetService.createWidget(body)
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to create widget')
  }
  
  return result.data
}) 