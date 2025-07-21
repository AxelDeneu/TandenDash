import { container } from '@/lib/di/container'

export default defineEventHandler(async (event) => {
  const dashboardService = container.getServiceFactory().createDashboardService()
  
  const result = await dashboardService.findAll()
  
  if (!result.success) {
    throw createError({
      statusCode: 500,
      statusMessage: result.error || 'Failed to fetch dashboards'
    })
  }
  
  return result.data
})