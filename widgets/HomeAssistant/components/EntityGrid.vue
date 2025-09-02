<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Settings2 } from 'lucide-vue-next'
import type { HassEntities } from 'home-assistant-js-websocket'
import type { SelectedEntity } from '../types/entity-config'
import DeviceRenderer from './DeviceRenderer.vue'
import CompactEntityRenderer from './CompactEntityRenderer.vue'
import { WidgetPlugin } from '../plugin'

const props = defineProps<{
  entities: SelectedEntity[]
  haEntities: HassEntities
  allowControl?: boolean
  showState?: boolean
  showLastUpdated?: boolean
  editMode?: boolean
  simpleMode?: boolean
}>()

const emit = defineEmits<{
  'toggle-entity': [entityConfig: SelectedEntity]
  'edit-entities': []
  'service-call': [domain: string, service: string, data?: Record<string, any>]
}>()

// i18n  
const { t } = useWidgetI18n(WidgetPlugin.id)

// Computed entities with HA data
const entitiesWithData = computed(() => {
  return props.entities
    .filter(entity => entity.entityId in props.haEntities)
    .map(entityConfig => ({
      config: entityConfig,
      entity: props.haEntities[entityConfig.entityId]
    }))
})

// Grid layout computation
const gridConfig = computed(() => {
  const entityCount = entitiesWithData.value.length
  
  // Determine optimal grid layout based on entity count and modes
  const compactCount = entitiesWithData.value.filter(e => e.config.displayMode === 'compact').length
  const defaultCount = entitiesWithData.value.filter(e => e.config.displayMode === 'default').length
  
  // For compact entities, we can fit more in a row
  if (entityCount <= 2) {
    return { cols: entityCount, rows: 1 }
  } else if (entityCount <= 4) {
    return { cols: 2, rows: Math.ceil(entityCount / 2) }
  } else if (entityCount <= 9) {
    return { cols: 3, rows: Math.ceil(entityCount / 3) }
  } else {
    return { cols: 4, rows: Math.ceil(entityCount / 4) }
  }
})

const gridClass = computed(() => {
  const { cols } = gridConfig.value
  return `grid grid-cols-${cols} gap-2`
})

// Handle entity toggle for compact mode
const handleEntityToggle = (entityConfig: SelectedEntity) => {
  emit('toggle-entity', entityConfig)
}

// Handle service calls from default mode entities
const handleServiceCall = (domain: string, service: string, data?: Record<string, any>) => {
  emit('service-call', domain, service, data)
}

// UI visibility
const showHeader = computed(() => !props.simpleMode)
const showFooter = computed(() => !props.simpleMode) 
const showEditButton = computed(() => props.editMode && !props.simpleMode)

// Responsive grid classes based on entity count
const responsiveGridClass = computed(() => {
  const count = entitiesWithData.value.length
  
  if (count === 1) return 'grid-cols-1'
  if (count === 2) return 'grid-cols-2'
  if (count <= 4) return 'grid-cols-2 lg:grid-cols-2'
  if (count <= 6) return 'grid-cols-2 lg:grid-cols-3'
  if (count <= 9) return 'grid-cols-3 lg:grid-cols-3'
  return 'grid-cols-3 lg:grid-cols-4'
})
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Header with edit button (optional) -->
    <div v-if="showHeader" class="flex items-center justify-between pb-3 border-b border-border/50">
      <h4 class="text-sm font-medium">
        {{ t('entityGrid.title') }} ({{ entitiesWithData.length }})
      </h4>
      
      <Button v-if="showEditButton" @click="$emit('edit-entities')" variant="ghost" size="sm">
        <Settings2 class="w-4 h-4" />
      </Button>
    </div>

    <!-- Entities grid -->
    <div :class="['flex-1 overflow-y-auto', showHeader ? 'pt-3' : '']">
      <div v-if="entitiesWithData.length === 0" class="flex items-center justify-center h-full text-center">
        <div class="space-y-3">
          <p class="text-sm text-muted-foreground">{{ t('entityGrid.noEntities') }}</p>
          <Button @click="$emit('edit-entities')" variant="outline" size="sm">
            <Plus class="w-4 h-4 mr-2" />
            {{ t('entityGrid.addFirstEntity') }}
          </Button>
        </div>
      </div>

      <div 
        v-else
        :class="['grid gap-3', responsiveGridClass]"
      >
        <!-- Render each entity based on its display mode -->
        <div 
          v-for="({ config, entity }) in entitiesWithData" 
          :key="config.entityId"
          class="min-h-0"
        >
          <!-- Compact mode -->
          <CompactEntityRenderer
            v-if="config.displayMode === 'compact'"
            :entity-config="config"
            :hass-entity="entity"
            :allow-control="allowControl"
            @toggle="handleEntityToggle"
          />
          
          <!-- Default mode -->
          <div v-else class="border rounded-lg p-3 bg-card/50">
            <DeviceRenderer
              :entity="entity"
              :allow-control="allowControl"
              :show-state="showState"
              :show-last-updated="showLastUpdated"
              @service-call="handleServiceCall"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Quick actions footer (optional) -->
    <div v-if="showFooter && entitiesWithData.length > 0" class="pt-3 border-t border-border/50">
      <div class="flex justify-between items-center text-xs text-muted-foreground">
        <span>
          {{ t('entityGrid.summary', { 
            total: entitiesWithData.length,
            compact: entitiesWithData.filter(e => e.config.displayMode === 'compact').length,
            default: entitiesWithData.filter(e => e.config.displayMode === 'default').length
          }) }}
        </span>
        
        <Button @click="$emit('edit-entities')" variant="ghost" size="sm" class="h-6 px-2 text-xs">
          {{ t('common.edit') }}
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Responsive grid utilities */
@media (max-width: 640px) {
  .grid-cols-4 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .grid-cols-3 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* Smooth transitions for grid changes */
.grid > div {
  transition: all 0.2s ease-in-out;
}

/* Scroll area optimization */
:deep(.scroll-area-viewport) {
  padding-right: 8px;
}
</style>