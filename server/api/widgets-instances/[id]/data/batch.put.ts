import { defineApiHandler, getNumericRouteParam, getValidatedBody } from '../../../../utils/api-handler'
import { z } from 'zod'

// Body should be an object with key-value pairs
const bodyValidator = (body: unknown) => z.record(z.any()).parse(body)

export default defineApiHandler(async ({ services, event }) => {
  const id = getNumericRouteParam(event, 'id')
  const body = await getValidatedBody(event, bodyValidator)
  
  const widgetDataService = services.createWidgetDataService()
  const result = await widgetDataService.setMultiple(id, body)
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to update widget data')
  }
  
  return result.data
})