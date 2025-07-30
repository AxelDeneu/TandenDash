import { defineApiHandler, getNumericRouteParam, getRouteParam } from '../../../../utils/api-handler'
import { widgetDataKeySchema } from '../../../../schemas'

export default defineApiHandler(async ({ services, event }) => {
  const id = getNumericRouteParam(event, 'id')
  const key = widgetDataKeySchema.parse(getRouteParam(event, 'key'))
  
  const widgetDataService = services.createWidgetDataService()
  const result = await widgetDataService.getValue(id, key)
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch widget data')
  }
  
  // Return the value directly, not wrapped in the data object
  return result.data
})