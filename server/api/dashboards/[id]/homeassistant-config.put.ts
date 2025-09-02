import { defineApiHandler, getNumericRouteParam, getValidatedBody } from '../../../utils/api-handler'
import { z } from 'zod'

const updateHomeAssistantConfigSchema = z.object({
  instanceUrl: z.string().url().or(z.literal('')),
  accessToken: z.string()
})

export default defineApiHandler(async ({ services, event }) => {
  const dashboardId = getNumericRouteParam(event, 'id')
  const body = await getValidatedBody(event, (data) => updateHomeAssistantConfigSchema.parse(data))
  
  const homeAssistantConfigService = services.createHomeAssistantConfigService()
  const result = await homeAssistantConfigService.updateDashboardConfig(dashboardId, body)
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to update HomeAssistant configuration')
  }

  return result.data
})