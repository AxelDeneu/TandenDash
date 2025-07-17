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
  isDragging?: boolean // Indique si ce widget est en train d'être déplacé
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
    left: '0px',
    top: '0px',
    ...(props.isDragging && { transition: 'all 0.2s ease-out' }),
    willChange: 'transform',
    transform: `translate(${pos.x}px, ${pos.y}px)`,
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
    :class="editMode ? 'border-2 border-primary/30 shadow-xl' : 'border border-transparent'"
  >
    <!-- Edit Mode Controls Bar -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 scale-75"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-75"
    >
      <div v-if="editMode" class="absolute -top-6 left-1/2 transform -translate-x-1/2 z-50">
        <div class="flex items-center gap-1 px-2 py-1.5 bg-background/90 backdrop-blur-md border border-border/50 rounded-full shadow-2xl">
        <!-- Drag Handle -->
        <div
          data-testid="drag-handle"
          class="flex items-center justify-center cursor-move touch-none select-none px-1.5 py-1 hover:text-foreground transition-colors"
          @mousedown="e => emit('dragstart', e, widget, page)"
          @touchstart="e => emit('dragstart', e, widget, page)"
        >
          <GripVertical class="w-4 h-4 text-muted-foreground/70" />
        </div>
        
        <!-- Separator -->
        <div class="w-px h-4 bg-border/50" />
        
        <!-- Edit Button -->
        <button
          data-testid="widget-edit-button"
          class="p-1.5 rounded-full hover:bg-background/80 text-muted-foreground hover:text-foreground transition-all duration-200 active:scale-95"
          @click="() => emit('edit', widget, page.id)"
        >
          <Edit class="w-4 h-4" />
        </button>
        
        <!-- Delete Button -->
        <button
          data-testid="widget-delete-button"
          class="p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all duration-200 active:scale-95"
          @click="() => emit('delete', widget, page.id)"
        >
          <Trash2 class="w-4 h-4" />
        </button>
      </div>
    </div>
    </Transition>
    <!-- Resize Handle -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 scale-50"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-50"
    >
      <div v-if="editMode" class="absolute -right-2 -bottom-2 z-50">
        <div
          data-testid="resize-handle"
          class="w-10 h-10 rounded-full bg-background/90 backdrop-blur-md border border-border/50 shadow-lg cursor-nwse-resize flex items-center justify-center touch-none hover:scale-110 active:scale-95 transition-all duration-200"
          @mousedown="e => emit('resizeStart', e, widget, page)"
          @touchstart="e => emit('resizeStart', e, widget, page)"
        >
          <MoveDiagonal2 class="w-4 h-4 text-muted-foreground/70" />
        </div>
      </div>
    </Transition>
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

<style scoped>
/* Enhanced shadows for floating controls */
.shadow-2xl {
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.05);
}

/* Smooth transitions for edit controls visibility */
[data-testid="widget-card"] {
  position: relative;
}

/* Drag handle hover effect */
[data-testid="drag-handle"]:hover {
  opacity: 1;
}

[data-testid="drag-handle"]:active {
  transform: scale(0.95);
}

/* Button hover ripple effect */
button:active {
  transform: scale(0.95);
}

/* Resize handle pulse on hover */
[data-testid="resize-handle"]:hover {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}
</style> 