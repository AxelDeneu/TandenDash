import { defineApiHandler, getNumericRouteParam } from '../../../utils/api-handler'

export default defineApiHandler(async ({ services, event }) => {
  const dashboardId = getNumericRouteParam(event, 'id')
  
  const homeAssistantConfigService = services.createHomeAssistantConfigService()
  const result = await homeAssistantConfigService.getDashboardConfig(dashboardId)
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to get HomeAssistant configuration')
  }

  return result.data
})