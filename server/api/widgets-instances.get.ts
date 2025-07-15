import { defineApiHandler, getValidatedQuery } from '../utils/api-handler'
import { createApiResponse } from '../utils/response'
import { setHeader } from 'h3'
import { z } from 'zod'

const widgetQuerySchema = z.object({
  pageId: z.string().transform(val => parseInt(val, 10)).optional()
})

export default defineApiHandler(async ({ services, event }) => {
  const query = getValidatedQuery(event, (data) => widgetQuerySchema.parse(data))
  
  const widgetService = services.createWidgetService()
  const result = await widgetService.getAllWidgets(query.pageId)
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch widgets')
  }

  // Ensure no caching for real-time updates
  setHeader(event, 'cache-control', 'no-store, no-cache, must-revalidate')
  setHeader(event, 'pragma', 'no-cache')
  setHeader(event, 'expires', '0')
  
  // Return data directly for backward compatibility
  return result.data || []
})