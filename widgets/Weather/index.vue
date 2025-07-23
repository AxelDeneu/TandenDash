<template>
  <div class="h-full w-full flex flex-col items-center justify-center p-4">
    <!-- Loading State -->
    <div v-if="weather.loading.value" class="w-full max-w-xs space-y-4">
      <Skeleton class="h-20 w-20 rounded-full mx-auto" />
      <Skeleton class="h-12 w-32 mx-auto" />
      <Skeleton class="h-6 w-48 mx-auto" />
      <Skeleton class="h-5 w-40 mx-auto" />
    </div>

    <!-- Error State -->
    <div v-else-if="weather.hasError.value" class="text-center space-y-4">
      <Cloud class="w-16 h-16 mx-auto text-muted-foreground opacity-50" />
      <Badge variant="destructive" class="text-sm">
        {{ weather.error.value }}
      </Badge>
      <Button 
        @click="weather.refresh" 
        variant="outline" 
        size="sm"
        class="mt-2"
      >
        <RefreshCw class="w-4 h-4 mr-2" />
        {{ t('actions.retry') }}
      </Button>
    </div>

    <!-- Weather Display -->
    <div v-else-if="weather.data.value" class="text-center space-y-3">
      <!-- Weather Icon -->
      <div class="relative">
        <img 
          v-if="weather.iconUrl.value"
          :src="weather.iconUrl.value" 
          :alt="weather.data.value.conditions"
          :class="iconSizeClass"
          class="mx-auto"
        />
        <!-- Refresh Button -->
        <Button
          @click="weather.refresh"
          variant="ghost"
          size="icon"
          class="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 hover:opacity-100 transition-opacity"
          :disabled="weather.loading.value"
        >
          <RefreshCw class="w-3 h-3" />
        </Button>
      </div>

      <!-- Temperature -->
      <div 
        :class="[
          'font-bold leading-none transition-all',
          temperatureSizeClass
        ]"
      >
        {{ weather.temperature.value }}
      </div>

      <!-- Condition -->
      <div :class="['text-muted-foreground capitalize', conditionSizeClass]">
        {{ weather.data.value.conditions }}
      </div>

      <!-- Location -->
      <div :class="['font-medium', locationSizeClass]">
        <MapPin class="inline-block w-3 h-3 mr-1 mb-1" />
        {{ weather.data.value.location }}
      </div>

      <!-- Additional Info -->
      <div v-if="showAdditionalInfo && (weather.data.value.humidity || weather.data.value.windSpeed)" 
           class="flex justify-center gap-4 text-sm text-muted-foreground mt-2">
        <div v-if="weather.data.value.humidity" class="flex items-center gap-1">
          <Droplets class="w-3 h-3" />
          {{ weather.data.value.humidity }}%
        </div>
        <div v-if="weather.data.value.windSpeed" class="flex items-center gap-1">
          <Wind class="w-3 h-3" />
          {{ weather.data.value.windSpeed }} km/h
        </div>
      </div>

      <!-- Last Updated -->
      <div v-if="weather.lastUpdated.value" class="text-xs text-muted-foreground opacity-60 mt-2">
        {{ t('states.updated') }} {{ formatLastUpdated(weather.lastUpdated.value) }}
      </div>
    </div>

    <!-- Empty State (no location configured) -->
    <div v-else class="text-center space-y-4">
      <CloudOff class="w-16 h-16 mx-auto text-muted-foreground opacity-50" />
      <p class="text-sm text-muted-foreground">
        {{ t('states.noLocation') }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { Cloud, CloudOff, MapPin, RefreshCw, Droplets, Wind } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { WeatherWidgetConfig } from './definition'
import { useWeather } from './composables/useWeather'
import { WidgetPlugin } from './plugin'

const props = defineProps<WeatherWidgetConfig>()

// i18n
const { t, locale } = useWidgetI18n(WidgetPlugin.id)

// Initialize weather composable
const weather = useWeather({
  location: props.location,
  unit: props.unit,
  locale: locale.value,
  autoRefresh: true,
  refreshInterval: 10 * 60 * 1000 // 10 minutes
})

// Size classes based on size prop
const iconSizeClass = computed(() => {
  switch (props.size) {
    case 'small': return 'w-12 h-12'
    case 'large': return 'w-20 h-20'
    default: return 'w-16 h-16'
  }
})

const temperatureSizeClass = computed(() => {
  switch (props.size) {
    case 'small': return 'text-2xl'
    case 'large': return 'text-5xl'
    default: return 'text-4xl'
  }
})

const conditionSizeClass = computed(() => {
  switch (props.size) {
    case 'small': return 'text-xs'
    case 'large': return 'text-lg'
    default: return 'text-sm'
  }
})

const locationSizeClass = computed(() => {
  switch (props.size) {
    case 'small': return 'text-xs'
    case 'large': return 'text-base'
    default: return 'text-sm'
  }
})

// Format last updated time
const formatLastUpdated = (date: Date) => {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return t('time.justNow')
  if (diffInSeconds < 3600) return t('time.minutesAgo', { count: Math.floor(diffInSeconds / 60) })
  if (diffInSeconds < 86400) return t('time.hoursAgo', { count: Math.floor(diffInSeconds / 3600) })
  return date.toLocaleDateString()
}

// Watch for location changes
watch(() => props.location, (newLocation) => {
  weather.updateLocation(newLocation)
})

// Watch for locale changes
watch(locale, () => {
  weather.fetchWeather()
})

// Lifecycle
onMounted(() => {
  weather.fetchWeather()
})

onUnmounted(() => {
  weather.cleanup()
})
</script>