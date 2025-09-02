<script setup lang="ts">
import { ref, computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Plus, Edit3, Trash2, GripVertical, Save, X } from 'lucide-vue-next'
import type { HassEntity } from 'home-assistant-js-websocket'
import type { SelectedEntity } from '../types/entity-config'
import { getDefaultIconForDomain } from '../types/entity-config'
import EntitySelector from './EntitySelector.vue'
import IconPicker from './IconPicker.vue'
import * as LucideIcons from 'lucide-vue-next'
import { WidgetPlugin } from '../plugin'

const props = defineProps<{
  entities: HassEntity[]
  selectedEntities: SelectedEntity[]
}>()

const emit = defineEmits<{
  'update': [entities: SelectedEntity[]]
  'close': []
}>()

// i18n
const { t } = useWidgetI18n(WidgetPlugin.id)

// State
const localEntities = ref<SelectedEntity[]>([...props.selectedEntities])
const showEntitySelector = ref(false)
const showIconPicker = ref(false)
const editingEntityIndex = ref(-1)

// Get icon component dynamically
const getIconComponent = (iconName: string) => {
  return (LucideIcons as any)[iconName] || LucideIcons.HelpCircle
}

// Get HA entity details
const getHassEntity = (entityId: string) => {
  return props.entities.find(e => e.entity_id === entityId)
}

// Add new entities from selector
const handleEntitySelect = (entityId: string) => {
  if (localEntities.value.find(e => e.entityId === entityId)) {
    return // Already selected
  }
  
  const hassEntity = getHassEntity(entityId)
  const domain = entityId.split('.')[0]
  
  const newEntity: SelectedEntity = {
    entityId,
    displayName: hassEntity?.attributes.friendly_name || entityId,
    customIcon: getDefaultIconForDomain(domain),
    displayMode: 'default',
    order: localEntities.value.length
  }
  
  localEntities.value.push(newEntity)
  showEntitySelector.value = false
}

// Remove entity
const removeEntity = (index: number) => {
  localEntities.value.splice(index, 1)
  // Update order
  localEntities.value.forEach((entity, i) => {
    entity.order = i
  })
}

// Move entity up/down
const moveEntity = (index: number, direction: 'up' | 'down') => {
  const newIndex = direction === 'up' ? index - 1 : index + 1
  
  if (newIndex < 0 || newIndex >= localEntities.value.length) return
  
  // Swap positions
  const [entity] = localEntities.value.splice(index, 1)
  localEntities.value.splice(newIndex, 0, entity)
  
  // Update order
  localEntities.value.forEach((entity, i) => {
    entity.order = i
  })
}

// Handle icon selection
const handleIconSelect = (icon: string) => {
  if (editingEntityIndex.value >= 0) {
    // Create a new array with updated entity to trigger reactivity
    localEntities.value = localEntities.value.map((entity, index) => 
      index === editingEntityIndex.value 
        ? { ...entity, customIcon: icon }
        : entity
    )
  }
  showIconPicker.value = false
  editingEntityIndex.value = -1
}

// Open icon picker
const openIconPicker = (index: number) => {
  editingEntityIndex.value = index
  showIconPicker.value = true
}

// Update entity methods for proper reactivity
const updateEntityName = (index: number, name: string) => {
  localEntities.value = localEntities.value.map((entity, i) => 
    i === index ? { ...entity, displayName: name } : entity
  )
}

const updateEntityMode = (index: number, mode: 'default' | 'compact') => {
  localEntities.value = localEntities.value.map((entity, i) => 
    i === index ? { ...entity, displayMode: mode } : entity
  )
}

// Save changes
const saveChanges = () => {
  emit('update', localEntities.value)
  emit('close')
}

// Cancel changes
const cancelChanges = () => {
  emit('close')
}

// Computed
const hasChanges = computed(() => {
  // Check if number of entities changed
  if (localEntities.value.length !== props.selectedEntities.length) return true
  
  // Compare each entity's properties individually
  return localEntities.value.some((local, index) => {
    const original = props.selectedEntities[index]
    if (!original) return true
    
    return local.entityId !== original.entityId ||
           local.displayName !== original.displayName ||
           local.customIcon !== original.customIcon ||
           local.displayMode !== original.displayMode ||
           local.order !== original.order
  })
})

const currentEditingIcon = computed(() => {
  if (editingEntityIndex.value >= 0) {
    return localEntities.value[editingEntityIndex.value]?.customIcon || 'HelpCircle'
  }
  return 'HelpCircle'
})
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between pb-4 border-b">
      <div>
        <h3 class="text-lg font-semibold">{{ t('entityConfig.title') }}</h3>
        <p class="text-sm text-muted-foreground">{{ t('entityConfig.description') }}</p>
      </div>
      <Button @click="cancelChanges" variant="ghost" size="sm">
        <X class="w-4 h-4" />
      </Button>
    </div>

    <!-- Entity list -->
    <ScrollArea class="flex-1 py-4">
      <div class="space-y-3">
        <!-- Entity configuration cards -->
        <div 
          v-for="(entity, index) in localEntities" 
          :key="entity.entityId"
          class="border rounded-lg p-4 space-y-3 bg-card"
        >
          <!-- Entity header with drag handle -->
          <div class="flex items-center gap-3">
            <GripVertical class="w-4 h-4 text-muted-foreground cursor-grab" />
            
            <div class="flex items-center gap-2 flex-1 min-w-0">
              <component :is="getIconComponent(entity.customIcon)" class="w-5 h-5" />
              <span class="text-sm font-medium truncate">
                {{ getHassEntity(entity.entityId)?.attributes.friendly_name || entity.entityId }}
              </span>
            </div>
            
            <!-- Entity actions -->
            <div class="flex gap-1">
              <Button @click="moveEntity(index, 'up')" :disabled="index === 0" variant="ghost" size="sm">
                ↑
              </Button>
              <Button @click="moveEntity(index, 'down')" :disabled="index === localEntities.length - 1" variant="ghost" size="sm">
                ↓
              </Button>
              <Button @click="removeEntity(index)" variant="ghost" size="sm" class="text-destructive hover:text-destructive">
                <Trash2 class="w-4 h-4" />
              </Button>
            </div>
          </div>

          <!-- Configuration fields -->
          <div class="grid grid-cols-2 gap-3">
            <!-- Display name -->
            <div class="space-y-2">
              <Label :for="`entity-name-${index}`" class="text-xs">{{ t('entityConfig.displayName') }}</Label>
              <Input
                :id="`entity-name-${index}`"
                :model-value="entity.displayName"
                @update:model-value="updateEntityName(index, $event)"
                :placeholder="getHassEntity(entity.entityId)?.attributes.friendly_name || entity.entityId"
                class="h-8 text-sm"
              />
            </div>

            <!-- Icon selection -->
            <div class="space-y-2">
              <Label class="text-xs">{{ t('entityConfig.icon') }}</Label>
              <Button 
                @click="openIconPicker(index)"
                variant="outline" 
                class="h-8 w-full justify-start text-sm"
              >
                <component :is="getIconComponent(entity.customIcon)" class="w-4 h-4 mr-2" />
                {{ entity.customIcon }}
              </Button>
            </div>
          </div>

          <!-- Display mode -->
          <div class="space-y-2">
            <Label class="text-xs">{{ t('entityConfig.displayMode') }}</Label>
            <RadioGroup 
              :model-value="entity.displayMode" 
              @update:model-value="updateEntityMode(index, $event)"
              class="flex gap-6"
            >
              <div class="flex items-center space-x-2">
                <RadioGroupItem :value="'default'" :id="`default-${index}`" />
                <Label :for="`default-${index}`" class="text-sm font-normal">{{ t('entityConfig.modes.default') }}</Label>
              </div>
              <div class="flex items-center space-x-2">
                <RadioGroupItem :value="'compact'" :id="`compact-${index}`" />
                <Label :for="`compact-${index}`" class="text-sm font-normal">{{ t('entityConfig.modes.compact') }}</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
        
        <!-- Add entity button -->
        <Button 
          @click="showEntitySelector = true"
          variant="dashed" 
          class="w-full h-16 border-2 border-dashed"
        >
          <Plus class="w-5 h-5 mr-2" />
          {{ t('entityConfig.addEntity') }}
        </Button>
      </div>
    </ScrollArea>

    <!-- Footer actions -->
    <div class="flex gap-2 pt-4 border-t">
      <Button @click="cancelChanges" variant="outline" class="flex-1">
        {{ t('common.cancel') }}
      </Button>
      <Button 
        @click="saveChanges" 
        :disabled="!hasChanges"
        class="flex-1"
      >
        <Save class="w-4 h-4 mr-2" />
        {{ t('common.save') }} ({{ localEntities.length }})
      </Button>
    </div>
  </div>

  <!-- Entity selector modal -->
  <Dialog v-model:open="showEntitySelector">
    <DialogContent class="max-w-4xl max-h-[80vh]">
      <DialogHeader>
        <DialogTitle>{{ t('selectEntity') }}</DialogTitle>
      </DialogHeader>
      
      <EntitySelector
        :entities="entities"
        @select="handleEntitySelect"
        @close="showEntitySelector = false"
        mode="add"
        :exclude-ids="localEntities.map(e => e.entityId)"
      />
    </DialogContent>
  </Dialog>

  <!-- Icon picker modal -->
  <IconPicker
    v-model:open="showIconPicker"
    :selected-icon="currentEditingIcon"
    @select="handleIconSelect"
  />
</template>