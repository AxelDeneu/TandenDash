import { defineApiHandler, getValidatedBody } from '../utils/api-handler'
import { updateModeStateSchema, modeStateSchema } from '../schemas'

export default defineApiHandler(async ({ services, event }) => {
  const body = await getValidatedBody(event, (data) => updateModeStateSchema.parse(data))
  
  const modeService = services.createModeService()
  const result = await modeService.setMode(body.mode)
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to set mode')
  }
  
  // Validate response format
  return modeStateSchema.parse({ mode: body.mode })
}) 