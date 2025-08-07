import { defineApiHandler, getNumericRouteParam, getRouteParam } from '../../../../utils/api-handler'
import { widgetDataKeySchema, widgetDataValueSchema } from '../../../../schemas'
import { z } from 'zod'
import { createError, readBody } from 'h3'

export default defineApiHandler(async ({ services, event }) => {
  const id = getNumericRouteParam(event, 'id')
  const key = widgetDataKeySchema.parse(getRouteParam(event, 'key'))
  
  // Get the body and extract the value
  const body = await readBody(event)
  const value = body.value
  
  const widgetDataService = services.createWidgetDataService()
  const result = await widgetDataService.setData(id, key, value)
  
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error || 'Failed to update widget data'
    })
  }
  
  return result.data
})