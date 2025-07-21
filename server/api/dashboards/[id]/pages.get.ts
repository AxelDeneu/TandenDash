import { container } from '@/lib/di/container'

export default defineEventHandler(async (event) => {
  const pageService = container.getServiceFactory().createPageService()
  
  const id = getRouterParam(event, 'id')
  
  if (!id || isNaN(Number(id))) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid dashboard ID'
    })
  }
  
  const result = await pageService.getPagesByDashboardId(Number(id))
  
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error || 'Failed to fetch pages'
    })
  }
  
  return result.data
})