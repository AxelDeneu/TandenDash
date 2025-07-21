import { container } from '@/lib/di/container'
import type { CreateDashboardRequest } from '@/types'

export default defineEventHandler(async (event) => {
  const dashboardService = container.getServiceFactory().createDashboardService()
  
  const body = await readBody<CreateDashboardRequest>(event)
  
  if (!body.name) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Dashboard name is required'
    })
  }
  
  const result = await dashboardService.create(body)
  
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error || 'Failed to create dashboard'
    })
  }
  
  return result.data
})