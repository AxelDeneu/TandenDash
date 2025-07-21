import { container } from '@/lib/di/container'

export default defineEventHandler(async (event) => {
  const dashboardSettingsService = container.getServiceFactory().createDashboardSettingsService()
  
  const id = getRouterParam(event, 'id')
  
  if (!id || isNaN(Number(id))) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid dashboard ID'
    })
  }
  
  const result = await dashboardSettingsService.findByDashboardId(Number(id))
  
  if (!result.success) {
    throw createError({
      statusCode: 404,
      statusMessage: result.error || 'Dashboard settings not found'
    })
  }
  
  return result.data
})