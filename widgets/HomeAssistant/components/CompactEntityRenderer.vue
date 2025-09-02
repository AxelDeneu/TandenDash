<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import type { HassEntity } from 'home-assistant-js-websocket'
import type { SelectedEntity } from '../types/entity-config'
import * as LucideIcons from 'lucide-vue-next'
import { WidgetPlugin } from '../plugin'

const props = defineProps<{
  entityConfig: SelectedEntity
  hassEntity?: HassEntity
  allowControl?: boolean
}>()

const emit = defineEmits<{
  'toggle': [entityConfig: SelectedEntity]
}>()

// i18n
const { t } = useWidgetI18n(WidgetPlugin.id)

// Get icon component dynamically
const IconComponent = computed(() => {
  return (LucideIcons as any)[props.entityConfig.customIcon] || LucideIcons.HelpCircle
})

// Entity state and styling
const entityState = computed(() => {
  if (!props.hassEntity) return 'unavailable'
  return props.hassEntity.state
})

const isOn = computed(() => {
  const state = entityState.value
  return state === 'on' || state === 'open' || state === 'unlocked' || 
         state === 'home' || state === 'playing' || parseFloat(state) > 0
})

const isUnavailable = computed(() => {
  return !props.hassEntity || entityState.value === 'unavailable'
})

// Button styling based on entity state
const buttonClass = computed(() => {
  const baseClass = 'h-12 w-12 p-0 rounded-lg transition-all duration-200'
  
  if (isUnavailable.value) {
    return `${baseClass} bg-muted text-muted-foreground cursor-not-allowed`
  }
  
  if (isOn.value) {
    return `${baseClass} bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg`
  }
  
  return `${baseClass} bg-background hover:bg-accent text-muted-foreground hover:text-foreground border-2 border-border hover:border-primary/50`
})

// Handle entity toggle
const handleToggle = () => {
  if (!props.allowControl || isUnavailable.value) return
  
  emit('toggle', props.entityConfig)
}

// Format entity value for display
const formatEntityValue = (value: string): string => {
  // For numeric values, try to add appropriate units
  const numValue = parseFloat(value)
  if (!isNaN(numValue)) {
    const domain = props.entityConfig.entityId.split('.')[0]
    
    if (domain === 'sensor') {
      const unit = props.hassEntity?.attributes.unit_of_measurement
      return unit ? `${numValue}${unit}` : value
    }
  }
  
  return value
}

const entityValue = computed(() => {
  if (!props.hassEntity) return ''
  
  // For binary sensors and switches, show state translation
  if (entityState.value === 'on' || entityState.value === 'off') {
    return t(`states.${entityState.value}`)
  }
  
  return formatEntityValue(entityState.value)
})
</script>

<template>
  <div class="flex flex-col items-center space-y-3 p-2">
    <!-- Entity toggle button -->
    <Button 
      @click="handleToggle"
      :class="buttonClass"
      :disabled="isUnavailable || !allowControl"
      :title="isUnavailable ? t('states.unavailable') : entityValue"
    >
      <IconComponent class="w-6 h-6" />
      
      <!-- State indicator dot -->
      <div 
        v-if="!isUnavailable"
        :class="[
          'absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-background',
          isOn ? 'bg-green-500' : 'bg-gray-400'
        ]"
      />
    </Button>
    
    <!-- Entity name -->
    <div class="text-center space-y-1 min-w-0 w-full">
      <p class="text-xs font-medium text-foreground truncate" :title="entityConfig.displayName">
        {{ entityConfig.displayName }}
      </p>
      
      <!-- Entity value/state (optional) -->
      <p v-if="entityValue && !['on', 'off'].includes(entityState)" 
         class="text-[10px] text-muted-foreground truncate"
         :title="entityValue"
      >
        {{ entityValue }}
      </p>
    </div>
  </div>
</template>

<style scoped>
/* Compact layout optimizations */
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Touch-optimized button size */
@media (hover: none) {
  .h-12 {
    min-height: 44px; /* iOS touch target minimum */
  }
}
</style>