import { defineApiHandler, getNumericRouteParam, getValidatedBody } from '../../../utils/api-handler'
import { duplicateDashboardSchema } from '../../../schemas'

export default defineApiHandler(async ({ services, event }) => {
  const id = getNumericRouteParam(event, 'id')
  const body = await getValidatedBody(event, (data) => duplicateDashboardSchema.parse(data))
  
  const dashboardService = services.createDashboardService()
  const result = await dashboardService.duplicateDashboard(id, body.name)
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to duplicate dashboard')
  }
  
  return result.data
})