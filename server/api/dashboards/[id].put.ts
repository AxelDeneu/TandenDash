import { container } from '@/lib/di/container'
import type { UpdateDashboardRequest } from '@/types'

export default defineEventHandler(async (event) => {
  const dashboardService = container.getServiceFactory().createDashboardService()
  
  const id = getRouterParam(event, 'id')
  
  if (!id || isNaN(Number(id))) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid dashboard ID'
    })
  }
  
  const body = await readBody<Partial<UpdateDashboardRequest>>(event)
  
  const result = await dashboardService.update(Number(id), body)
  
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error || 'Failed to update dashboard'
    })
  }
  
  return result.data
})