import { defineApiHandler, getNumericRouteParam } from '../../../utils/api-handler'

export default defineApiHandler(async ({ services, event }) => {
  const id = getNumericRouteParam(event, 'id')
  
  const pageService = services.createPageService()
  const result = await pageService.getPagesByDashboardId(id)
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch pages')
  }
  
  return result.data
})