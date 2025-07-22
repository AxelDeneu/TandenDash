<script setup lang="ts">
// Vue imports
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

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

const { t } = useI18n()
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
  
  const configUI = selectedPlugin.value.configUI;
  if (!configUI) return undefined;
  
  // Convert old format to new format if necessary
  if (configUI.groups && Array.isArray(configUI.groups)) {
    const convertedGroups = configUI.groups.map((group: any) => {
      if (group.options && !Array.isArray(group.options)) {
        // Already in the correct format
        return group;
      }
      
      // Convert array format to Record format
      const optionsRecord: Record<string, any> = {};
      if (Array.isArray(group.options)) {
        group.options.forEach((opt: any) => {
          if (opt.id) {
            optionsRecord[opt.id] = opt;
          }
        });
      }
      
      return {
        ...group,
        options: optionsRecord
      };
    });
    
    return {
      ...configUI,
      groups: convertedGroups
    };
  }
  
  return configUI;
});

const widgetDisplayName = computed(() => {
  if (!selectedPlugin.value) return '';
  // Get display name from plugin
  return selectedPlugin.value.name || selectedWidgetType.value;
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
        <DialogTitle>{{ mode === 'edit' ? t('dashboard.editWidget') : t('dashboard.addWidget') }}</DialogTitle>
      </DialogHeader>
      <div class="mb-4">
        <label class="block mb-2">{{ t('widgets.title') }}</label>
        <Select v-model="selectedWidgetType" :disabled="mode === 'edit'" data-testid="widget-type-select">
          <SelectTrigger class="w-full">
            <SelectValue :placeholder="t('widgets.selectWidget')" />
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
          :widget-type="selectedWidgetType"
          v-model="widgetOptions" 
        />
      </div>
      <DialogFooter>
        <Button @click="handleSave" :disabled="!selectedWidgetType" data-testid="widget-save-button">{{ mode === 'edit' ? t('common.save') : t('common.add') }}</Button>
        <DialogClose as-child><Button variant="secondary" @click="emit('close')" data-testid="widget-cancel-button">{{ t('common.cancel') }}</Button></DialogClose>
      </DialogFooter>
    </DialogScrollContent>
  </Dialog>
</template> 