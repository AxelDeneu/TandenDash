<script setup lang="ts">
// Vue imports
import { ref, computed, watch, onMounted } from 'vue'

// UI component imports
import { Dialog, DialogScrollContent, DialogHeader, DialogFooter, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

// Component imports
import WidgetOptionsForm from './WidgetOptionsForm.vue'

// Composable imports
import { useWidgetOperations, useWidgetPlugins } from '@/composables'

// Type imports
import type { WidgetInstance } from '@/types'

type Props = {
  open: boolean
  pageId: number | null
  editWidget?: WidgetInstance
  mode?: 'add' | 'edit'
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'close': []
  'widget-added': [pageId: number]
  'widget-edited': [pageId: number]
}>()

const widgetPlugins = useWidgetPlugins();
const widgetOperations = useWidgetOperations();

// Ensure widget system is initialized when dialog opens
watch(() => props.open, async (isOpen) => {
  if (isOpen && !widgetPlugins.isInitialized.value) {
    console.log('Dialog opened, ensuring widget system is initialized...')
    await widgetPlugins.initialize()
  }
})

const availableWidgets = computed(() => widgetPlugins.getAllPlugins());
const selectedWidgetType = ref('');
const widgetOptions = ref<Record<string, any>>({});

const optionsDef = computed(() => {
  const widget = availableWidgets.value.find(w => w.id === selectedWidgetType.value);
  return widget?.defaultConfig || {};
});

const selectedPlugin = computed(() => {
  if (!selectedWidgetType.value) return null;
  // Get the plugin using the widget system
  return widgetPlugins.getPlugin(selectedWidgetType.value);
});

const enhancedConfig = computed(() => {
  if (!selectedPlugin.value) return undefined;
  
  // Get the configUI from the plugin manifest
  return selectedPlugin.value.configUI;
});

const widgetDisplayName = computed(() => {
  if (!selectedPlugin.value) return '';
  // Get display name from plugin metadata
  return selectedPlugin.value.metadata?.name || selectedWidgetType.value;
});

// Prefill for edit mode
onMounted(() => {
  if (props.mode === 'edit' && props.editWidget) {
    selectedWidgetType.value = props.editWidget.type;
    try {
      widgetOptions.value = props.editWidget.options ? 
        (typeof props.editWidget.options === 'string' ? JSON.parse(props.editWidget.options) : props.editWidget.options) : {};
    } catch {
      widgetOptions.value = {};
    }
  }
});

watch(selectedWidgetType, (val) => {
  if (props.mode === 'edit' && props.editWidget) return; // Don't overwrite in edit mode
  widgetOptions.value = { ...optionsDef.value };
});

const handleSave = async () => {
  if (!props.pageId || !selectedWidgetType.value) return;
  
  try {
    let finalOptions = { ...widgetOptions.value };
    if (props.mode === 'edit' && props.editWidget) {
      // Update widget instance using new architecture
      let position = props.editWidget.position;
      if (typeof position === 'string') {
        try { 
          const parsed = JSON.parse(position);
          // Convert DB format to API format if needed
          if (parsed.left && parsed.top) {
            position = {
              x: parseInt(parsed.left),
              y: parseInt(parsed.top),
              width: parseInt(parsed.width),
              height: parseInt(parsed.height)
            };
          } else {
            position = parsed;
          }
        } catch { 
          position = { x: 100, y: 100, width: 300, height: 200 }; 
        }
      }
      
      const updatedWidget = {
        id: props.editWidget.id,
        type: selectedWidgetType.value,
        options: finalOptions,
        position: position,
        pageId: props.pageId
      };
      
      await widgetOperations.updateWidget(updatedWidget);
      emit('widget-edited', props.pageId);
    } else {
      // Add new widget using new architecture
      const defaultPosition = { x: 100, y: 100, width: 300, height: 200 };
      
      if (!props.pageId) {
        return;
      }
      
      const newWidget = {
        type: selectedWidgetType.value,
        position: defaultPosition,
        options: finalOptions,
        pageId: props.pageId
      };
      
      await widgetOperations.createWidget(newWidget);
      emit('widget-added', props.pageId);
    }
    
    // Reset form
    selectedWidgetType.value = '';
    widgetOptions.value = {};
  } catch (error) {
    console.error('Failed to save widget:', error);
    // Error is handled by widgetOperations composable
  }
};
</script>
<template>
  <Dialog :open="open" @update:open="val => { if (!val) emit('close') }" data-testid="widget-dialog">
    <DialogScrollContent>
      <DialogHeader>
        <DialogTitle>{{ mode === 'edit' ? 'Edit Widget' : 'Add Widget' }}</DialogTitle>
      </DialogHeader>
      <div class="mb-4">
        <label class="block mb-2">Widget Type</label>
        <Select v-model="selectedWidgetType" :disabled="mode === 'edit'" data-testid="widget-type-select">
          <SelectTrigger class="w-full">
            <SelectValue placeholder="Select widget" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="w in availableWidgets" :key="w.id" :value="w.id" :data-testid="`widget-option-${w.id.toLowerCase()}`">
              {{ w.name }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div v-if="selectedWidgetType && Object.keys(optionsDef).length" class="mb-4">
        <WidgetOptionsForm 
          :options-def="optionsDef" 
          :enhanced-config="enhancedConfig"
          :widget-type="widgetDisplayName"
          v-model="widgetOptions" 
        />
      </div>
      <DialogFooter>
        <Button @click="handleSave" :disabled="!selectedWidgetType" data-testid="widget-save-button">{{ mode === 'edit' ? 'Save' : 'Add' }}</Button>
        <DialogClose as-child><Button variant="secondary" @click="emit('close')" data-testid="widget-cancel-button">Cancel</Button></DialogClose>
      </DialogFooter>
    </DialogScrollContent>
  </Dialog>
</template> 