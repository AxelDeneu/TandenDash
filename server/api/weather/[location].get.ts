import { defineEventHandler, getRouterParam, getQuery, createError } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const location = getRouterParam(event, 'location')
    const lang = getQuery(event).lang as string || 'en'
    
    console.log('[Weather API] Request for location:', location, 'lang:', lang)
    
    if (!location) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Location parameter is required'
      })
    }

    const { openweatherApiKey } = useRuntimeConfig()
    
    console.log('[Weather API] API key configured:', !!openweatherApiKey)
    
    if (!openweatherApiKey) {
      throw createError({
        statusCode: 500,
        statusMessage: 'OpenWeather API key is not configured. Please set NUXT_OPENWEATHER_API_KEY environment variable.'
      })
    }

    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&units=metric&appid=${openweatherApiKey}&lang=${lang}`
    
    console.log('[Weather API] Calling URL:', apiUrl.replace(openweatherApiKey, '***'))
    
    // Use native fetch instead of $fetch to avoid potential issues
    const response = await fetch(apiUrl)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('[Weather API] OpenWeather API error:', response.status, errorData)
      
      if (response.status === 404) {
        throw createError({
          statusCode: 404,
          statusMessage: 'City not found'
        })
      }
      
      throw createError({
        statusCode: 500,
        statusMessage: `OpenWeather API error: ${response.status}`
      })
    }
    
    const data = await response.json()
    console.log('[Weather API] Success for location:', location)
    return data
  } catch (error) {
    console.error('[Weather API] Unhandled error:', error)
    
    // If it's already a createError, re-throw it
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    
    // Otherwise, create a generic error
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch weather data'
    })
  }
})