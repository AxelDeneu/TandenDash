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
  
  const body = await readBody<{ name: string }>(event)
  
  if (!body.name) {
    throw createError({
      statusCode: 400,
      statusMessage: 'New dashboard name is required'
    })
  }
  
  const result = await dashboardService.duplicateDashboard(Number(id), body.name)
  
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error || 'Failed to duplicate dashboard'
    })
  }
  
  return result.data
})