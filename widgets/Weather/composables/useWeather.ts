import { ref, computed } from 'vue'

export interface WeatherData {
  location: string
  temperature: number
  conditions: string
  icon: string
  humidity?: number
  windSpeed?: number
}

export interface UseWeatherOptions {
  location: string
  unit?: 'celsius' | 'fahrenheit'
  locale?: string
  autoRefresh?: boolean
  refreshInterval?: number // in milliseconds
}

export function useWeather(options: UseWeatherOptions) {
  const { location, unit = 'celsius', locale = 'en', autoRefresh = true, refreshInterval = 600000 } = options // 10 minutes default

  // State
  const data = ref<WeatherData | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdated = ref<Date | null>(null)
  
  let refreshTimer: number | null = null

  // Computed
  const temperature = computed(() => {
    if (!data.value) return ''
    
    // Temperature is already in the correct unit from the API
    const temp = data.value.temperature
      
    return `${temp}°${unit === 'fahrenheit' ? 'F' : 'C'}`
  })

  const iconUrl = computed(() => {
    if (!data.value?.icon) return ''
    return `https://openweathermap.org/img/wn/${data.value.icon}@2x.png`
  })

  const hasError = computed(() => !!error.value)
  const isEmpty = computed(() => !data.value && !loading.value && !error.value)

  // Methods
  const fetchWeather = async () => {
    if (!location || location.trim() === '') {
      error.value = 'Please configure a location'
      data.value = null
      return
    }

    loading.value = true
    error.value = null

    try {
      const response = await $fetch<WeatherData>('/api/widgets/weather/current', {
        query: { location, unit, locale }
      })

      data.value = response
      lastUpdated.value = new Date()
      
      // Setup auto-refresh if enabled
      if (autoRefresh && refreshTimer === null) {
        refreshTimer = window.setInterval(() => {
          fetchWeather()
        }, refreshInterval)
      }
    } catch (err) {
      console.error('Failed to fetch weather:', err)
      error.value = err instanceof Error ? err.message : 'Failed to load weather data'
      data.value = null
    } finally {
      loading.value = false
    }
  }

  const refresh = () => {
    return fetchWeather()
  }

  const cleanup = () => {
    if (refreshTimer !== null) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }
  }

  const updateLocation = (newLocation: string) => {
    if (newLocation !== location) {
      cleanup()
      return fetchWeather()
    }
  }

  return {
    // State
    data: computed(() => data.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    lastUpdated: computed(() => lastUpdated.value),
    
    // Computed
    temperature,
    iconUrl,
    hasError,
    isEmpty,
    
    // Methods
    refresh,
    cleanup,
    updateLocation,
    fetchWeather
  }
}