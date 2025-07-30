import { defineApiHandler, getValidatedBody } from '../utils/api-handler'
import { updateWidgetSchema } from '../schemas'

export default defineApiHandler(async ({ services, event }) => {
  const body = await getValidatedBody(event, (data) => updateWidgetSchema.parse(data))
  
  const widgetService = services.createWidgetService()
  const { id, ...updateData } = body
  const result = await widgetService.updateWidget(id, updateData)
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to update widget')
  }
  
  return result.data
}) 