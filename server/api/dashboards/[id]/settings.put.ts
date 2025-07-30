import { defineApiHandler, getNumericRouteParam, getValidatedBody } from '../../../utils/api-handler'
import { dashboardSettingsSchema } from '../../../schemas'

export default defineApiHandler(async ({ services, event }) => {
  const dashboardId = getNumericRouteParam(event, 'id')
  const body = await getValidatedBody(event, (data) => dashboardSettingsSchema.parse(data))
  
  const dashboardSettingsService = services.createDashboardSettingsService()
  const result = await dashboardSettingsService.update(dashboardId, { ...body, dashboardId })
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to update dashboard settings')
  }
  
  return result.data
})