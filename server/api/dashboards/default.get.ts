import { defineApiHandler } from '../../utils/api-handler'

export default defineApiHandler(async ({ services }) => {
  const dashboardService = services.createDashboardService()
  
  const result = await dashboardService.findDefault()
  
  if (!result.success) {
    throw new Error(result.error || 'No default dashboard found')
  }
  
  return result.data
})