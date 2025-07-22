import type { WidgetApiRoute } from '@/lib/widgets/api-routes'
import { getQuery, createError } from 'h3'
import type { WeatherData } from './composables/useWeather'

// Simple in-memory cache
const cache = new Map<string, { data: WeatherData; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// OpenWeatherMap API response type
interface OpenWeatherResponse {
  name: string
  main: {
    temp: number
    humidity: number
  }
  weather: Array<{
    description: string
    icon: string
  }>
  wind: {
    speed: number
  }
}

// API Routes for weather widget
export const weatherApiRoutes: WidgetApiRoute[] = [
  {
    method: 'GET',
    path: 'current',
    handler: async (event) => {
      const { location, unit = 'celsius', locale = 'en' } = getQuery(event) as { location?: string; unit?: 'celsius' | 'fahrenheit'; locale?: string }
      
      if (!location) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Location parameter is required'
        })
      }
      
      // Check cache first
      const cacheKey = `${location.toLowerCase()}_${unit}_${locale}`
      const cached = cache.get(cacheKey)
      
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data
      }
      
      // Fetch weather data from OpenWeatherMap API
      const apiKey = process.env.NUXT_WEATHER_API_KEY
      
      if (!apiKey) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Weather API key not configured'
        })
      }
      
      try {
        // Convert unit to OpenWeatherMap format
        const apiUnits = unit === 'fahrenheit' ? 'imperial' : 'metric'
        
        const response = await $fetch<OpenWeatherResponse>(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=${apiUnits}&lang=${locale}`
        )
        
        const weatherData: WeatherData = {
          location: response.name,
          temperature: Math.round(response.main.temp),
          conditions: response.weather[0].description,
          icon: response.weather[0].icon,
          humidity: response.main.humidity,
          windSpeed: Math.round(response.wind.speed * 3.6) // Convert m/s to km/h
        }
        
        // Update cache
        cache.set(cacheKey, {
          data: weatherData,
          timestamp: Date.now()
        })
        
        // Clean old cache entries
        if (cache.size > 100) {
          const sortedEntries = Array.from(cache.entries())
            .sort((a, b) => a[1].timestamp - b[1].timestamp)
          
          // Remove oldest entries
          for (let i = 0; i < 50; i++) {
            cache.delete(sortedEntries[i][0])
          }
        }
        
        return weatherData
      } catch (error: any) {
        console.error('OpenWeatherMap API error:', error)
        
        if (error?.statusCode === 404) {
          throw createError({
            statusCode: 404,
            statusMessage: 'Location not found'
          })
        }
        
        throw createError({
          statusCode: 503,
          statusMessage: 'Weather service unavailable'
        })
      }
    }
  }
]