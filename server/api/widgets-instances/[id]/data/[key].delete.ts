import { defineApiHandler, getNumericRouteParam, getRouteParam } from '../../../../utils/api-handler'
import { widgetDataKeySchema } from '../../../../schemas'

export default defineApiHandler(async ({ services, event }) => {
  const id = getNumericRouteParam(event, 'id')
  const key = widgetDataKeySchema.parse(getRouteParam(event, 'key'))
  
  const widgetDataService = services.createWidgetDataService()
  const result = await widgetDataService.deleteData(id, key)
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to delete widget data')
  }
  
  return { success: result.data }
})