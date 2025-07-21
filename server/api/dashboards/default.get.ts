import { container } from '@/lib/di/container'

export default defineEventHandler(async (event) => {
  const dashboardService = container.getServiceFactory().createDashboardService()
  
  const result = await dashboardService.findDefault()
  
  if (!result.success) {
    throw createError({
      statusCode: 404,
      statusMessage: result.error || 'No default dashboard found'
    })
  }
  
  return result.data
})