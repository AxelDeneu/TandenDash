import { defineApiHandler, getNumericRouteParam } from '../../../utils/api-handler'

export default defineApiHandler(async ({ services, event }) => {
  const id = getNumericRouteParam(event, 'id')
  
  const dashboardSettingsService = services.createDashboardSettingsService()
  const result = await dashboardSettingsService.findByDashboardId(id)
  
  if (!result.success) {
    throw new Error(result.error || 'Dashboard settings not found')
  }
  
  return result.data
})