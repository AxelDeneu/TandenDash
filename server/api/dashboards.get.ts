import { defineApiHandler } from '../utils/api-handler'

export default defineApiHandler(async ({ services }) => {
  const dashboardService = services.createDashboardService()
  
  const result = await dashboardService.findAll()
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch dashboards')
  }
  
  return result.data
})