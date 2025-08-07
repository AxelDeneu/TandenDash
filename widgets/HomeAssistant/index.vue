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
import type { WidgetConfig } from './definition'
import { WidgetPlugin } from './plugin'

const props = defineProps<WidgetConfig & { widgetInstanceId?: number }>()

// i18n
const { t } = useWidgetI18n(WidgetPlugin.id)

// Initialize composables
const ha = useHomeAssistant()
const storage = useWidgetStorage({ 
  widgetInstanceId: props.widgetInstanceId,
  autoSave: true 
})
const eventBus = useWidgetEventBus()

// State
const selectedEntityId = storage.createStorageRef('selectedEntityId', '')
const showEntitySelector = ref(false)
const isEditMode = ref(false)

// Computed
const selectedEntity = computed(() => {
  if (!selectedEntityId.value || !ha.isConnected.value) return null
  return ha.getEntity(selectedEntityId.value)
})

const isConfigured = computed(() => {
  return !!props.instanceUrl && !!props.accessToken
})

// Methods
const handleConnect = async () => {
  if (!isConfigured.value) return
  
  try {
    await ha.connect({
      instanceUrl: props.instanceUrl,
      accessToken: props.accessToken
    })
  } catch (error) {
    console.error('[Widget] Failed to connect:', error)
  }
}

const handleEntitySelect = (entityId: string) => {
  selectedEntityId.value = entityId
  showEntitySelector.value = false
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
    selectedEntityId: selectedEntityId.value 
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

// Watch for config changes
watch(() => [props.instanceUrl, props.accessToken], () => {
  if (isConfigured.value && ha.isConnected.value) {
    handleConnect()
  }
})

// Watch for selectedEntityId changes
watch(selectedEntityId, (newValue, oldValue) => {
  console.log('[HomeAssistant Widget] selectedEntityId changed:', { oldValue, newValue })
})
</script>

<template>
  <div class="h-full flex flex-col items-stretch justify-start">
    <!-- Not configured -->
    <template v-if="!isConfigured">
      <div class="flex items-center justify-center h-full">
        <div class="text-center">
          <AlertCircle class="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p class="text-sm text-muted-foreground">
            {{ t('notConfigured') }}
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
      
      <!-- Entity selector -->
      <template v-else-if="showEntitySelector">
        <div class="pb-3">
          <h3 class="text-lg font-semibold">
            {{ t('selectEntity') }}
          </h3>
        </div>
        <div class="pt-0 flex-1 min-h-0">
          <EntitySelector
            :entities="ha.entityList.value"
            :selected-id="selectedEntityId"
            @select="handleEntitySelect"
            @close="showEntitySelector = false"
          />
        </div>
      </template>
      
      <!-- Main content -->
      <template v-else>
        <!-- Header with settings -->
        <div v-if="props.showEntityName" class="pb-3">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">
              {{ selectedEntity?.attributes.friendly_name || selectedEntityId || t('widget.name') }}
            </h3>
            <Button
              variant="ghost"
              size="icon"
              @click="showEntitySelector = true"
            >
              <Settings2 class="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <!-- Content -->
        <div :class="{ 'pt-0': props.showEntityName }">
          <!-- Edit mode floating button -->
          <Transition
            enter-active-class="transition-all duration-300 ease-out"
            enter-from-class="opacity-0 scale-75"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition-all duration-200 ease-in"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-75"
          >
            <div v-if="isEditMode && ha.isConnected.value && !props.showEntityName" class="absolute top-2 right-2 z-10">
              <Button
                variant="ghost"
                size="icon"
                class="bg-background/90 backdrop-blur-md border border-border/50 shadow-lg hover:shadow-xl transition-all duration-200"
                @click="showEntitySelector = true"
                :title="t('changeEntity')"
              >
                <Settings2 class="w-4 h-4" />
              </Button>
            </div>
          </Transition>
          
          <!-- No entity selected -->
          <div v-if="!selectedEntity" class="text-center py-8">
            <p class="text-sm text-muted-foreground mb-4">
              {{ t('states.selectEntity') }}
            </p>
            <Button 
              variant="outline" 
              size="sm"
              @click="showEntitySelector = true"
            >
              {{ t('selectEntity') }}
            </Button>
          </div>
          
          <!-- Entity display -->
          <CameraRenderer
            v-else-if="selectedEntity.entity_id.startsWith('camera.')"
            :entity="selectedEntity"
            :instance-url="props.instanceUrl"
            :access-token="props.accessToken"
            :allow-control="props.allowControl"
            :show-camera-controls="props.showCameraControls"
            @service-call="handleServiceCall"
          />
          <DeviceRenderer
            v-else
            :entity="selectedEntity"
            :allow-control="props.allowControl"
            :show-state="props.showEntityState"
            :show-last-updated="props.showLastUpdated"
            @service-call="handleServiceCall"
          />
        </div>
      </template>
    </template>
  </div>
</template>