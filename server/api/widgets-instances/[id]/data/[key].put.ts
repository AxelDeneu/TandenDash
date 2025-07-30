import { defineApiHandler, getNumericRouteParam, getRouteParam, getValidatedBody } from '../../../../utils/api-handler'
import { widgetDataKeySchema, widgetDataValueSchema } from '../../../../schemas'

export default defineApiHandler(async ({ services, event }) => {
  const id = getNumericRouteParam(event, 'id')
  const key = widgetDataKeySchema.parse(getRouteParam(event, 'key'))
  
  const body = await getValidatedBody(event, (data) => widgetDataValueSchema.parse(data))
  
  const widgetDataService = services.createWidgetDataService()
  const result = await widgetDataService.setData(id, key, body)
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to update widget data')
  }
  
  return result.data
})