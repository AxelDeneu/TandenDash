import { defineApiHandler, getValidatedBody } from '../utils/api-handler'
import { createDashboardSchema } from '../schemas'

export default defineApiHandler(async ({ services, event }) => {
  const body = await getValidatedBody(event, (data) => createDashboardSchema.parse(data))
  
  const dashboardService = services.createDashboardService()
  const result = await dashboardService.create(body)
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to create dashboard')
  }
  
  return result.data
})