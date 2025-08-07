<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import type { HassEntity } from 'home-assistant-js-websocket'
import { 
  Lightbulb, 
  Power, 
  Thermometer, 
  Home, 
  Lock, 
  Play, 
  Pause,
  SkipForward,
  Volume2,
  Camera
} from 'lucide-vue-next'
import { WidgetPlugin } from '../plugin'

// i18n
const { t } = useWidgetI18n(WidgetPlugin.id)

const props = defineProps<{
  entity: HassEntity
  allowControl?: boolean
  showState?: boolean
  showLastUpdated?: boolean
}>()

const emit = defineEmits<{
  'service-call': [domain: string, service: string, data?: Record<string, any>]
}>()

// Extract domain and entity name
const domain = computed(() => props.entity.entity_id.split('.')[0])
const entityName = computed(() => props.entity.entity_id.split('.')[1])

// Get icon based on domain
const icon = computed(() => {
  const icons: Record<string, any> = {
    light: Lightbulb,
    switch: Power,
    sensor: Thermometer,
    climate: Home,
    lock: Lock,
    media_player: Play,
    camera: Camera
  }
  return icons[domain.value] || Power
})

// Format state display
const formattedState = computed(() => {
  const state = props.entity.state
  const unit = props.entity.attributes.unit_of_measurement
  
  if (state === 'on') return t('states.on')
  if (state === 'off') return t('states.off')
  if (state === 'unavailable') return t('states.unavailable')
  if (state === 'unknown') return t('states.unknown')
  
  return unit ? `${state} ${unit}` : state
})

// Check if entity is controllable
const isControllable = computed(() => {
  if (!props.allowControl) return false
  
  const controllableDomains = ['light', 'switch', 'lock', 'cover', 'fan', 'climate', 'media_player']
  return controllableDomains.includes(domain.value)
})

// Check if entity is binary (on/off)
const isBinary = computed(() => {
  return ['light', 'switch', 'fan'].includes(domain.value)
})

// Check if entity has brightness
const hasBrightness = computed(() => {
  return domain.value === 'light' && props.entity.attributes.brightness !== undefined
})

// Toggle entity
const toggleEntity = (value: boolean) => {
  const service = value ? 'turn_on' : 'turn_off'
  console.log('[DeviceRenderer] Toggling entity:', { 
    entity: props.entity.entity_id, 
    currentState: props.entity.state,
    newValue: value,
    service 
  })
  emit('service-call', domain.value, service, {
    entity_id: props.entity.entity_id
  })
}

// Set brightness
const setBrightness = (value: number[]) => {
  emit('service-call', 'light', 'turn_on', {
    entity_id: props.entity.entity_id,
    brightness: Math.round(value[0] * 2.55) // Convert 0-100 to 0-255
  })
}

// Format last updated
const formatLastUpdated = (timestamp: string): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  
  if (minutes < 1) return t('time.justNow')
  if (minutes < 60) return t('time.minutesAgo', { minutes })
  
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return t('time.hoursAgo', { hours })
  
  const days = Math.floor(hours / 24)
  return t('time.daysAgo', { days })
}
</script>

<template>
  <div class="space-y-4">
    <!-- Main display -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <component :is="icon" class="w-6 h-6 text-muted-foreground" />
        <div>
          <div class="font-medium">
            {{ entity.attributes.friendly_name || entityName }}
          </div>
          <div v-if="showState" class="text-sm text-muted-foreground">
            {{ formattedState }}
          </div>
        </div>
      </div>
      
      <!-- Control -->
      <div v-if="isControllable">
        <!-- Binary control -->
        <Switch
          v-if="isBinary"
          :model-value="entity.state === 'on'"
          @update:model-value="toggleEntity"
        />
        
        <!-- Lock control -->
        <Button
          v-else-if="domain === 'lock'"
          variant="outline"
          size="sm"
          @click="toggleEntity"
        >
          <Lock class="w-4 h-4 mr-2" />
          {{ entity.state === 'locked' ? t('actions.unlock') : t('actions.lock') }}
        </Button>
        
        <!-- Media player control -->
        <div v-else-if="domain === 'media_player'" class="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            @click="emit('service-call', 'media_player', 'media_play_pause', { entity_id: entity.entity_id })"
          >
            <component :is="entity.state === 'playing' ? Pause : Play" class="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            @click="emit('service-call', 'media_player', 'media_next_track', { entity_id: entity.entity_id })"
          >
            <SkipForward class="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <!-- State badge for non-controllable -->
      <Badge v-else-if="showState" variant="secondary">
        {{ formattedState }}
      </Badge>
    </div>
    
    <!-- Brightness slider -->
    <div v-if="hasBrightness && isControllable" class="space-y-2">
      <div class="flex items-center justify-between text-sm">
        <span class="text-muted-foreground">{{ t('attributes.brightness') }}</span>
        <span class="font-medium">
          {{ Math.round((entity.attributes.brightness || 0) / 2.55) }}%
        </span>
      </div>
      <Slider
        :value="[Math.round((entity.attributes.brightness || 0) / 2.55)]"
        :max="100"
        :step="1"
        @update:value="setBrightness"
      />
    </div>
    
    <!-- Additional attributes -->
    <div v-if="entity.attributes.temperature" class="flex items-center justify-between text-sm">
      <span class="text-muted-foreground">{{ t('attributes.temperature') }}</span>
      <span class="font-medium">{{ entity.attributes.temperature }}°</span>
    </div>
    
    <div v-if="entity.attributes.humidity" class="flex items-center justify-between text-sm">
      <span class="text-muted-foreground">{{ t('attributes.humidity') }}</span>
      <span class="font-medium">{{ entity.attributes.humidity }}%</span>
    </div>
    
    <!-- Last updated -->
    <div v-if="showLastUpdated" class="text-xs text-muted-foreground text-right">
      {{ t('attributes.lastUpdated') }} {{ formatLastUpdated(entity.last_updated) }}
    </div>
  </div>
</template>