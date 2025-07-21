import { defineApiHandler, getNumericRouteParam, getRouteParam } from '../../../../utils/api-handler'

export default defineApiHandler(async ({ services, event }) => {
  const id = getNumericRouteParam(event, 'id')
  const key = getRouteParam(event, 'key')
  
  if (!key || key.length === 0) {
    throw new Error('Invalid key parameter')
  }
  
  const widgetDataService = services.createWidgetDataService()
  const result = await widgetDataService.deleteData(id, key)
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to delete widget data')
  }
  
  return { success: result.data }
})