import { defineApiHandler, getNumericRouteParam, getRouteParam } from '../../../../utils/api-handler'

export default defineApiHandler(async ({ services, event }) => {
  const id = getNumericRouteParam(event, 'id')
  const key = getRouteParam(event, 'key')
  
  if (!key || key.length === 0) {
    throw new Error('Invalid key parameter')
  }
  
  const widgetDataService = services.createWidgetDataService()
  const result = await widgetDataService.getValue(id, key)
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch widget data')
  }
  
  // Return the value directly, not wrapped in the data object
  return result.data
})