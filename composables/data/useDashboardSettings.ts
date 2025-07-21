import { ref, computed, readonly, watch } from 'vue'
import type { DashboardSettings, UpdateDashboardSettingsRequest } from '@/types'
import { useLogger } from '@/composables'

export function useDashboardSettings(dashboardId: number) {
  const logger = useLogger({ module: 'useDashboardSettings' })

  // State
  const settings = ref<DashboardSettings | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const isDirty = ref(false)

  // Track original settings for dirty checking
  const originalSettings = ref<DashboardSettings | null>(null)

  // Computed
  const isLoading = computed(() => loading.value)
  const hasError = computed(() => !!error.value)
  
  // Computed settings values
  const locale = computed(() => settings.value?.locale || 'fr')
  const measurementSystem = computed(() => settings.value?.measurementSystem || 'metric')
  const temperatureUnit = computed(() => settings.value?.temperatureUnit || 'celsius')
  const timeFormat = computed(() => settings.value?.timeFormat || '24h')
  const dateFormat = computed(() => settings.value?.dateFormat || 'DD/MM/YYYY')
  const timezone = computed(() => settings.value?.timezone || 'Europe/Paris')
  const theme = computed(() => settings.value?.theme || 'auto')

  // Watch for changes to mark as dirty
  watch(settings, (newSettings) => {
    if (!originalSettings.value || !newSettings) {
      isDirty.value = false
      return
    }

    isDirty.value = JSON.stringify(newSettings) !== JSON.stringify(originalSettings.value)
  }, { deep: true })

  // Fetch settings
  const fetchSettings = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<DashboardSettings>(`/api/dashboards/${dashboardId}/settings`)
      settings.value = response
      originalSettings.value = { ...response }
      isDirty.value = false
      logger.info('Dashboard settings loaded', { dashboardId })
      return response
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load dashboard settings'
      error.value = message
      logger.error('Failed to load dashboard settings', err, { dashboardId })
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update settings
  const updateSettings = async (data: Partial<UpdateDashboardSettingsRequest>) => {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<DashboardSettings>(`/api/dashboards/${dashboardId}/settings`, {
        method: 'PUT',
        body: data
      })
      
      settings.value = response
      originalSettings.value = { ...response }
      isDirty.value = false
      
      logger.info('Dashboard settings updated', { dashboardId, changes: Object.keys(data) })
      return response
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update dashboard settings'
      error.value = message
      logger.error('Failed to update dashboard settings', err, { dashboardId })
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update individual settings
  const updateLocale = (value: string) => updateSettings({ locale: value })
  const updateMeasurementSystem = (value: 'metric' | 'imperial') => updateSettings({ measurementSystem: value })
  const updateTemperatureUnit = (value: 'celsius' | 'fahrenheit') => updateSettings({ temperatureUnit: value })
  const updateTimeFormat = (value: '24h' | '12h') => updateSettings({ timeFormat: value })
  const updateDateFormat = (value: string) => updateSettings({ dateFormat: value })
  const updateTimezone = (value: string) => updateSettings({ timezone: value })
  const updateTheme = (value: 'light' | 'dark' | 'auto') => updateSettings({ theme: value })

  // Reset to original settings
  const resetSettings = () => {
    if (originalSettings.value) {
      settings.value = { ...originalSettings.value }
      isDirty.value = false
    }
  }

  // Format helpers based on settings
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date
    const format = dateFormat.value
    
    const day = d.getDate().toString().padStart(2, '0')
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const year = d.getFullYear()
    
    return format
      .replace('DD', day)
      .replace('MM', month)
      .replace('YYYY', year.toString())
      .replace('YY', year.toString().slice(-2))
  }

  const formatTime = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date
    const hours = d.getHours()
    const minutes = d.getMinutes().toString().padStart(2, '0')
    
    if (timeFormat.value === '12h') {
      const period = hours >= 12 ? 'PM' : 'AM'
      const displayHours = hours % 12 || 12
      return `${displayHours}:${minutes} ${period}`
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes}`
  }

  const formatDistance = (meters: number) => {
    if (measurementSystem.value === 'imperial') {
      const miles = meters * 0.000621371
      return miles < 1 
        ? `${Math.round(miles * 5280)} ft`
        : `${miles.toFixed(1)} mi`
    }
    
    return meters < 1000
      ? `${Math.round(meters)} m`
      : `${(meters / 1000).toFixed(1)} km`
  }

  const formatWeight = (kg: number) => {
    if (measurementSystem.value === 'imperial') {
      const lbs = kg * 2.20462
      return `${lbs.toFixed(1)} lbs`
    }
    
    return `${kg.toFixed(1)} kg`
  }

  // Initialize
  fetchSettings()

  return {
    // State
    settings: readonly(settings),
    loading: readonly(loading),
    error: readonly(error),
    isDirty: readonly(isDirty),
    isLoading,
    hasError,
    
    // Computed values
    locale,
    measurementSystem,
    temperatureUnit,
    timeFormat,
    dateFormat,
    timezone,
    theme,
    
    // Methods
    fetchSettings,
    updateSettings,
    updateLocale,
    updateMeasurementSystem,
    updateTemperatureUnit,
    updateTimeFormat,
    updateDateFormat,
    updateTimezone,
    updateTheme,
    resetSettings,
    
    // Formatters
    formatDate,
    formatTime,
    formatDistance,
    formatWeight
  }
}