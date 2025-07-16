<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { cn } from '../../lib/utils';
import { fontSizeStyle, toPixels } from '../../lib/utils/font-sizes';
import type { WeatherWidgetConfig } from './definition';
import { applyWeatherIconAnimation } from './animations';

// Props
const props = defineProps<WeatherWidgetConfig>();

// Reactive state variables
const temperature = ref<string>('');
const condition = ref<string>('');
const iconUrl = ref<string>('');
const locationName = ref<string>('');
const loading = ref<boolean>(true);

// Fetch Weather Data
const fetchWeatherData = async () => {
  loading.value = true;

  // Check if location is provided
  if (!props.location || props.location.trim() === '') {
    temperature.value = 'N/A';
    condition.value = 'Please configure a location';
    iconUrl.value = '';
    locationName.value = 'No location set';
    loading.value = false;
    return;
  }

  // Use browser language for condition description (primary subtag only)
  const browserLang = (navigator.language || 'en').split('-')[0];
  
  try {
    // Use server-side API endpoint to protect the API key
    const data = await $fetch(`/api/weather/${encodeURIComponent(props.location)}`, {
      query: { lang: browserLang }
    });

    temperature.value = `${Math.round(data.main.temp)}°C`;
    condition.value = data.weather[0].description;
    iconUrl.value = `https://openweathermap.org/img/wn/${data.weather[0].icon}.png`;
    locationName.value = data.name;
  } catch (error) {
    console.error(error);
    temperature.value = 'N/A';
    condition.value = 'N/A';
    iconUrl.value = '';
    locationName.value = 'Unknown';
  } finally {
    loading.value = false;
  }
};

// Re-fetch weather data when the location changes
watch(() => props.location, fetchWeatherData);

// Fetch data on mount
onMounted(() => {
  fetchWeatherData();

  // Optional: animate weather icon
  nextTick(() => {
    const iconElement = document.querySelector('[data-testid="weather-icon"]');
    if (iconElement && props.showIcon) {
      applyWeatherIconAnimation(iconElement as HTMLElement, 'bounce');
    }
  });
});

// Dynamic classes
const temperatureClass = computed(() => cn('font-bold'));
const temperatureStyle = computed(() => fontSizeStyle(props.temperatureSize || 36));

const conditionClass = computed(() => cn('capitalize'));
const conditionStyle = computed(() => fontSizeStyle(props.conditionSize || 18));

const locationClass = computed(() => cn('font-semibold'));
const locationStyle = computed(() => fontSizeStyle(props.locationSize || 20));

const iconClass = computed(() => cn(props.iconSize || 'w-12 h-12'));
</script>

<template>
  <div class="h-full w-full flex flex-col items-center justify-center space-y-4">
    <div v-if="loading" class="text-lg text-gray-500">Loading...</div>
    <template v-else>
      <!-- Weather Icon -->
      <div v-if="showIcon && iconUrl" data-testid="weather-icon" :class="iconClass">
        <img :src="iconUrl" alt="Weather Icon" />
      </div>

      <!-- Temperature -->
      <div v-if="showTemperature" :class="temperatureClass" :style="temperatureStyle" data-testid="temperature">
        {{ temperature }}
      </div>

      <!-- Condition -->
      <div v-if="showCondition" :class="conditionClass" :style="conditionStyle" data-testid="condition">
        {{ condition }}
      </div>

      <!-- Location -->
      <div v-if="showLocation" :class="locationClass" :style="locationStyle" data-testid="location">
        {{ locationName }}
      </div>
    </template>
  </div>
</template>