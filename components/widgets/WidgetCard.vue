<script setup lang="ts">
import { ref, computed } from 'vue'
import { GripVertical, MoveDiagonal2, Edit, Trash2 } from '@/lib/icons'
import { Button } from '@/components/ui/button'
import type { WidgetInstance, WidgetPosition, Page } from '@/types'
import { useWidgetPlugins } from '@/composables'
import WidgetErrorBoundaryWrapper from './WidgetErrorBoundaryWrapper.vue'

const props = defineProps<{
  widget: WidgetInstance
  page: Page
  editMode: boolean
  tempPosition?: WidgetPosition // Position temporaire pendant drag/resize
}>()

const emit = defineEmits<{
  (e: 'dragstart', event: MouseEvent | TouchEvent, widget: WidgetInstance, page: Page): void
  (e: 'resizeStart', event: MouseEvent | TouchEvent, widget: WidgetInstance, page: Page): void
  (e: 'edit', widget: WidgetInstance, pageId: number): void
  (e: 'delete', widget: WidgetInstance, pageId: number): void
}>()

// Get widget plugins
const widgetPlugins = useWidgetPlugins()

// Position finale = tempPosition OU position parsée du widget
const displayPosition = computed<WidgetPosition>(() => {
  if (props.tempPosition) return props.tempPosition
  
  try {
    const pos = JSON.parse(props.widget.position)
    
    // Convertir l'ancien format si nécessaire
    if ('left' in pos && 'top' in pos) {
      return {
        x: parseInt(pos.left),
        y: parseInt(pos.top),
        width: parseInt(pos.width || '300'),
        height: parseInt(pos.height || '200')
      }
    }
    
    // Nouveau format
    return pos
  } catch {
    return { x: 100, y: 100, width: 300, height: 200 }
  }
})

const widgetStyle = computed(() => {
  const pos = displayPosition.value
  return {
    position: 'absolute',
    left: `${pos.x}px`,
    top: `${pos.y}px`,
    width: `${pos.width}px`,
    height: `${pos.height}px`,
  }
})

const widgetProps = computed(() => {
  const plugin = widgetPlugins.getPlugin(props.widget.type)
  if (!plugin) {
    console.error(`Widget plugin not found for type: ${props.widget.type}`)
    return {}
  }
  
  try {
    const options = props.widget.options ? JSON.parse(props.widget.options) : {}
    // Merge default config with widget options to ensure all required props are present
    const mergedProps = {
      ...plugin.defaultConfig,
      ...options,
      id: props.widget.id  // Include widget instance ID for widgets that need to update themselves
    }
    
    // Check for any numeric keys and warn if found
    const numericKeys = Object.keys(mergedProps).filter(key => !isNaN(Number(key)))
    if (numericKeys.length > 0) {
      console.warn(`Widget ${props.widget.type} has numeric keys in props:`, numericKeys)
    }
    
    // Filter out any numeric keys to prevent Vue attribute errors
    const filteredProps = Object.fromEntries(
      Object.entries(mergedProps).filter(([key]) => isNaN(Number(key)))
    )
    
    return filteredProps
  } catch (error) {
    console.error('Error parsing widget options:', error)
    return plugin.defaultConfig || {}
  }
})

// Get widget component
const widgetComponent = computed(() => {
  const plugin = widgetPlugins.getPlugin(props.widget.type)
  return plugin?.component || null
})
</script>

<template>
  <div
    data-testid="widget-card"
    :data-widget-type="widget.type"
    :data-widget-id="widget.id"
    class="absolute bg-card rounded-lg p-4"
    :style="widgetStyle"
    :class="editMode ? 'border-2 border-blue-500 shadow-lg' : ''"
  >
    <div v-if="editMode" class="absolute top-2 right-2 z-50 flex gap-3 items-center">
      <div
        data-testid="drag-handle"
        class="cursor-grab absolute left-full top-0 ml-2 bg-blue-500 rounded-r-md touch-none active:cursor-grabbing active:opacity-75 transition-opacity"
        @mousedown="e => emit('dragstart', e, widget, page)"
        @touchstart="e => emit('dragstart', e, widget, page)"
      >
        <GripVertical class="w-8 h-12 text-white p-1" />
      </div>
      <Button data-testid="widget-edit-button" size="touch-icon" variant="secondary" @click="() => emit('edit', widget, page.id)">
        <Edit class="w-6 h-6" />
      </Button>
      <Button data-testid="widget-delete-button" size="touch-icon" variant="destructive" @click="() => emit('delete', widget, page.id)">
        <Trash2 class="w-6 h-6" />
      </Button>
    </div>
    <div v-if="editMode" class="absolute right-0 bottom-0 z-50">
      <div
        data-testid="resize-handle"
        class="w-11 h-11 p-2 rounded-tl-md bg-blue-500 rounded-br-md cursor-nwse-resize flex items-center justify-center touch-none active:opacity-75 transition-opacity"
        @mousedown="e => emit('resizeStart', e, widget, page)"
        @touchstart="e => emit('resizeStart', e, widget, page)"
      >
        <MoveDiagonal2 class="w-6 h-6 text-white" />
      </div>
    </div>
    <div class="w-full h-full" data-testid="widget-content">
      <WidgetErrorBoundaryWrapper
        v-if="widgetComponent"
        :widget-id="widget.type"
        :instance-id="`widget-${widget.id}`"
        :max-retries="3"
      >
        <component 
          :is="widgetComponent"
          v-bind="widgetProps" 
        />
      </WidgetErrorBoundaryWrapper>
      <div v-else class="text-muted-foreground text-sm p-4 text-center">
        Widget type "{{ widget.type }}" not found
      </div>
    </div>
  </div>
</template> 