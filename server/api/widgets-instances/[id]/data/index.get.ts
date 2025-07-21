import { defineApiHandler, getNumericRouteParam } from '../../../../utils/api-handler'

export default defineApiHandler(async ({ services, event }) => {
  const id = getNumericRouteParam(event, 'id')
  
  const widgetDataService = services.createWidgetDataService()
  const result = await widgetDataService.getAllData(id)
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch widget data')
  }
  
  return result.data || []
})