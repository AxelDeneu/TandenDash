import { defineApiHandler, getNumericRouteParam, getRouteParam, getValidatedBody } from '../../../../utils/api-handler'
import { z } from 'zod'

// The body can be any valid JSON value
const bodyValidator = (body: unknown) => z.any().parse(body)

export default defineApiHandler(async ({ services, event }) => {
  const id = getNumericRouteParam(event, 'id')
  const key = getRouteParam(event, 'key')
  
  if (!key || key.length === 0) {
    throw new Error('Invalid key parameter')
  }
  
  const body = await getValidatedBody(event, bodyValidator)
  
  const widgetDataService = services.createWidgetDataService()
  const result = await widgetDataService.setData(id, key, body)
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to update widget data')
  }
  
  return result.data
})