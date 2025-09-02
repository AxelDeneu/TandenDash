<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { AlertCircle, Settings2, RefreshCw } from 'lucide-vue-next'
import { useHomeAssistant } from './composables/useHomeAssistant'
import { useWidgetStorage } from './composables/useWidgetStorage'
import { useWidgetEventBus } from '@/composables'
import EntitySelector from './components/EntitySelector.vue'
import DeviceRenderer from './components/DeviceRenderer.vue'
import CameraRenderer from './components/CameraRenderer.vue'
import EntityConfigManager from './components/EntityConfigManager.vue'
import EntityGrid from './components/EntityGrid.vue'
import type { WidgetConfig } from './definition'
import type { SelectedEntity } from './types/entity-config'
import { getDefaultIconForDomain } from './types/entity-config'
import { WidgetPlugin } from './plugin'

const props = defineProps<WidgetConfig & { widgetInstanceId?: number; pageId?: number }>()

// i18n
const { t } = useWidgetI18n(WidgetPlugin.id)

// Get dashboard ID from route
const route = useRoute()
const dashboardId = computed(() => {
  return route.params.id ? Number(route.params.id) : null
})

// Initialize composables
const ha = useHomeAssistant(dashboardId.value)
const storage = useWidgetStorage({ 
  widgetInstanceId: props.widgetInstanceId,
  autoSave: true 
})
const eventBus = useWidgetEventBus()

// State - Migration from single to multiple entities
const selectedEntities = storage.createStorageRef<SelectedEntity[]>('selectedEntities', [])
const showEntityManager = ref(false)
const isEditMode = ref(false)

// Migration from old single entity storage
const migrateFromSingleEntity = () => {
  const oldEntityId = storage.getValue('selectedEntityId')
  if (oldEntityId && selectedEntities.value.length === 0) {
    const hassEntity = ha.getEntity(oldEntityId)
    const domain = oldEntityId.split('.')[0]
    
    const migratedEntity: SelectedEntity = {
      entityId: oldEntityId,
      displayName: hassEntity?.attributes.friendly_name || oldEntityId,
      customIcon: getDefaultIconForDomain(domain),
      displayMode: 'default',
      order: 0
    }
    
    selectedEntities.value = [migratedEntity]
    storage.removeValue('selectedEntityId') // Cleanup old storage
  }
}

// Computed
const hasEntities = computed(() => selectedEntities.value.length > 0)

const isConfigured = computed(() => {
  return dashboardId.value !== null
})

// Methods
const handleConnect = async () => {
  if (!isConfigured.value) return
  
  try {
    await ha.connectWithDashboardConfig()
    // After successful connection, migrate old data
    migrateFromSingleEntity()
  } catch (error) {
    console.error('[Widget] Failed to connect:', error)
  }
}

const handleEntitiesUpdate = (entities: SelectedEntity[]) => {
  selectedEntities.value = entities
}

const handleEntityToggle = async (entityConfig: SelectedEntity) => {
  try {
    const entity = ha.getEntity(entityConfig.entityId)
    const domain = entityConfig.entityId.split('.')[0]
    
    // Handle different entity types
    if (domain === 'light' || domain === 'switch' || domain === 'input_boolean') {
      const service = entity?.state === 'on' ? 'turn_off' : 'turn_on'
      await ha.callService(domain, service, { entity_id: entityConfig.entityId })
    } else if (domain === 'cover') {
      const service = entity?.state === 'open' ? 'close_cover' : 'open_cover'
      await ha.callService(domain, service, { entity_id: entityConfig.entityId })
    } else if (domain === 'lock') {
      const service = entity?.state === 'unlocked' ? 'lock' : 'unlock'
      await ha.callService(domain, service, { entity_id: entityConfig.entityId })
    }
    // Add more entity types as needed
  } catch (error) {
    console.error('[Widget] Failed to toggle entity:', error)
  }
}

const handleServiceCall = async (domain: string, service: string, data?: Record<string, any>) => {
  console.log('[Widget] Received service call request:', { domain, service, data })
  try {
    await ha.callService(domain, service, data)
  } catch (error) {
    console.error('[Widget] Service call failed:', error)
  }
}

// Lifecycle
onMounted(() => {
  console.log('[HomeAssistant Widget] Mounted:', { 
    widgetInstanceId: props.widgetInstanceId,
    selectedEntities: selectedEntities.value.length
  })
  
  // Listen for edit mode changes
  eventBus.on('editMode:changed', (value) => {
    isEditMode.value = value
  })
  
  if (isConfigured.value) {
    handleConnect()
  }
})

onUnmounted(() => {
  ha.disconnect()
})

// Watch for dashboard ID changes
watch(dashboardId, () => {
  if (isConfigured.value) {
    handleConnect()
  }
})

// Watch for selectedEntities changes
watch(selectedEntities, (newValue, oldValue) => {
  console.log('[HomeAssistant Widget] selectedEntities changed:', { 
    oldCount: oldValue?.length || 0, 
    newCount: newValue?.length || 0,
    entities: newValue?.map(e => e.entityId) || []
  })
}, { deep: true })
</script>

<template>
  <div class="h-full flex flex-col items-stretch justify-start">
    <!-- Not configured -->
    <template v-if="!isConfigured">
      <div class="flex items-center justify-center h-full">
        <div class="text-center">
          <AlertCircle class="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p class="text-sm text-muted-foreground">
            {{ t('configureInDashboardSettings') }}
          </p>
        </div>
      </div>
    </template>
    
    <!-- Configured -->
    <template v-else>
      <!-- Error state -->
      <div v-if="ha.error.value" class="flex items-center justify-center h-full">
        <div class="text-center">
          <AlertCircle class="w-12 h-12 text-destructive mx-auto mb-4" />
          <p class="text-sm text-muted-foreground mb-4">
            {{ ha.error.value.message }}
          </p>
          <Button 
            variant="outline" 
            size="sm"
            @click="handleConnect"
          >
            <RefreshCw class="w-4 h-4 mr-2" />
            {{ t('actions.retry') }}
          </Button>
        </div>
      </div>
      
      <!-- Entity configuration manager -->
      <template v-else-if="showEntityManager || !hasEntities">
        <EntityConfigManager
          :entities="ha.entityList.value"
          :selected-entities="selectedEntities"
          @update="handleEntitiesUpdate"
          @close="showEntityManager = false"
        />
      </template>
      
      <!-- Main content - Entity grid -->
      <template v-else>
        <div class="h-full relative">
          <!-- Edit button - only in edit mode -->
          <Transition
            enter-active-class="transition-all duration-300 ease-out"
            enter-from-class="opacity-0 scale-75"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition-all duration-200 ease-in"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-75"
          >
            <Button 
              v-if="isEditMode"
              @click="showEntityManager = true" 
              class="absolute top-2 right-2 z-10 bg-background/90 backdrop-blur-md border border-border/50 shadow-lg hover:shadow-xl transition-all duration-200"
              variant="ghost" 
              size="icon"
              :title="t('entityConfig.title')"
            >
              <Settings2 class="w-4 h-4" />
            </Button>
          </Transition>
          
          <!-- Simple entity grid -->
          <EntityGrid
            :entities="selectedEntities"
            :ha-entities="ha.entities.value"
            :allow-control="props.allowControl"
            :show-state="props.showEntityState"
            :show-last-updated="props.showLastUpdated"
            :edit-mode="false"
            :simple-mode="true"
            @toggle-entity="handleEntityToggle"
            @service-call="handleServiceCall"
          />
        </div>
      </template>
    </template>
  </div>
</template>