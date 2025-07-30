import { defineApiHandler, getNumericRouteParam } from '../../utils/api-handler'

export default defineApiHandler(async ({ services, event }) => {
  const id = getNumericRouteParam(event, 'id')
  
  const dashboardService = services.createDashboardService()
  const result = await dashboardService.findById(id)
  
  if (!result.success) {
    throw new Error(result.error || 'Dashboard not found')
  }
  
  return result.data
})