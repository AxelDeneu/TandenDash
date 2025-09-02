import { defineApiHandler, getNumericRouteParam, getValidatedBody } from '../../../utils/api-handler'
import { z } from 'zod'

const testHomeAssistantConfigSchema = z.object({
  instanceUrl: z.string().url(),
  accessToken: z.string().min(1)
})

export default defineApiHandler(async ({ services, event }) => {
  const body = await getValidatedBody(event, (data) => testHomeAssistantConfigSchema.parse(data))
  
  const homeAssistantConfigService = services.createHomeAssistantConfigService()
  const result = await homeAssistantConfigService.testConnection(body)
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to test HomeAssistant connection')
  }

  return { success: result.data }
})