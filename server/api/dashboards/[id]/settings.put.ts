import { container } from '@/lib/di/container'
import type { UpdateDashboardSettingsRequest } from '@/types'

export default defineEventHandler(async (event) => {
  const dashboardSettingsService = container.getServiceFactory().createDashboardSettingsService()
  
  const id = getRouterParam(event, 'id')
  
  if (!id || isNaN(Number(id))) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid dashboard ID'
    })
  }
  
  const body = await readBody<Partial<UpdateDashboardSettingsRequest>>(event)
  
  const result = await dashboardSettingsService.update(Number(id), body)
  
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error || 'Failed to update dashboard settings'
    })
  }
  
  return result.data
})