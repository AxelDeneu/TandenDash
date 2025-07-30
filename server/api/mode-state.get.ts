import { defineApiHandler } from '../utils/api-handler'
import { modeStateSchema } from '../schemas'

export default defineApiHandler(async ({ services }) => {
  const modeService = services.createModeService()
  const result = await modeService.getCurrentMode()
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to get current mode')
  }
  
  // Validate response format
  return modeStateSchema.parse({ mode: result.data || 'light' })
}) 