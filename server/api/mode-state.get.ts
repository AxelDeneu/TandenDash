import { container } from '@/lib/di/container'

export default defineEventHandler(async () => {
  const modeService = container.getServiceFactory().createModeService()
  const result = await modeService.getCurrentMode()
  
  if (!result.success) {
    throw createError({
      statusCode: 500,
      statusMessage: result.error || 'Failed to get current mode'
    })
  }
  
  return { mode: result.data || 'light' }
}) 