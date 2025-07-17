import type { WidgetApiRoute } from '@/lib/widgets/api-routes'
import { getQuery, createError } from 'h3'

// API Routes for weather widget
export const weatherApiRoutes: WidgetApiRoute[] = [
  {
    method: 'GET',
    path: 'current',
    handler: async (event) => {
      const { location } = getQuery(event) as { location?: string }
      
      if (!location) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Location parameter is required'
        })
      }
      
      // Fetch weather data from OpenWeatherMap API
      const apiKey = process.env.NUXT_WEATHER_API_KEY
      
      if (!apiKey) {
        // Return mock data if no API key is configured
        return {
          location,
          temperature: 22,
          conditions: 'Sunny',
          icon: '01d',
          humidity: 65,
          windSpeed: 12,
          isMockData: true
        }
      }
      
      try {
        const response = await $fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric`
        )
        
        return {
          location: response.name,
          temperature: Math.round(response.main.temp),
          conditions: response.weather[0].description,
          icon: response.weather[0].icon,
          humidity: response.main.humidity,
          windSpeed: Math.round(response.wind.speed * 3.6) // Convert m/s to km/h
        }
      } catch (error) {
        console.error('OpenWeatherMap API error:', error)
        throw createError({
          statusCode: 503,
          statusMessage: 'Weather service unavailable'
        })
      }
    }
  }
]