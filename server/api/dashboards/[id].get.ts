import { container } from '@/lib/di/container'

export default defineEventHandler(async (event) => {
  const dashboardService = container.getServiceFactory().createDashboardService()
  
  const id = getRouterParam(event, 'id')
  
  if (!id || isNaN(Number(id))) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid dashboard ID'
    })
  }
  
  const result = await dashboardService.findById(Number(id))
  
  if (!result.success) {
    throw createError({
      statusCode: 404,
      statusMessage: result.error || 'Dashboard not found'
    })
  }
  
  return result.data
})