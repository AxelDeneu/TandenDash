import { defineApiHandler, getNumericRouteParam, getValidatedBody } from '../../utils/api-handler'
import { updateDashboardSchema } from '../../schemas'

export default defineApiHandler(async ({ services, event }) => {
  const id = getNumericRouteParam(event, 'id')
  const body = await getValidatedBody(event, (data) => updateDashboardSchema.parse(data))
  
  const dashboardService = services.createDashboardService()
  const result = await dashboardService.update(id, { ...body, id })
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to update dashboard')
  }
  
  return result.data
})