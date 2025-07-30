import { defineApiHandler, getNumericRouteParam, getValidatedBody } from '../../../../utils/api-handler'
import { widgetDataBatchSchema } from '../../../../schemas'

export default defineApiHandler(async ({ services, event }) => {
  const id = getNumericRouteParam(event, 'id')
  const body = await getValidatedBody(event, (data) => widgetDataBatchSchema.parse({ data }))
  
  const widgetDataService = services.createWidgetDataService()
  const result = await widgetDataService.setMultiple(id, body.data)
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to update widget data')
  }
  
  return result.data
})