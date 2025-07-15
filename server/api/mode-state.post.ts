import { container } from '@/lib/di/container'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  if (!body?.mode) {
    throw createError({ 
      statusCode: 400, 
      statusMessage: 'Mode required' 
    })
  }
  
  if (body.mode !== 'light' && body.mode !== 'dark') {
    throw createError({ 
      statusCode: 400, 
      statusMessage: 'Mode must be "light" or "dark"' 
    })
  }
  
  const modeService = container.getServiceFactory().createModeService()
  const result = await modeService.setMode(body.mode)
  
  if (!result.success) {
    throw createError({
      statusCode: 500,
      statusMessage: result.error || 'Failed to set mode'
    })
  }
  
  return { mode: body.mode }
}) 