import { defineEventHandler, createError } from 'h3'
import { weatherApiRoutes } from '@/widgets/Weather/api'

// Simple registry for widget API routes
const widgetApiRoutes: Record<string, any> = {
  weather: weatherApiRoutes
}

export default defineEventHandler(async (event) => {
  const { type, path } = event.context.params as { type: string; path: string }
  const method = event.method
  
  // Get widget routes
  const routes = widgetApiRoutes[type]
  
  if (!routes) {
    throw createError({
      statusCode: 404,
      statusMessage: `Widget type '${type}' not found`
    })
  }
  
  // Find matching route
  const route = routes.find((r: any) => 
    r.method === method && r.path === path
  )
  
  if (!route) {
    throw createError({
      statusCode: 404,
      statusMessage: `Route not found: ${method} ${path}`
    })
  }
  
  // Execute handler
  try {
    return await route.handler(event)
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Internal server error'
    })
  }
})