<script setup lang="ts">
import { computed, ref, type PropType } from 'vue'
import { DockButton } from '@/components/ui/dock'
import { useFloatingDock } from '@/composables/ui/useFloatingDock'
import { cn } from '@/lib/utils'
import type * as Icons from '@/lib/icons'
import { GripVertical } from 'lucide-vue-next'

export interface DockAction {
  id: string
  icon: keyof typeof Icons
  label: string
  active?: boolean
  disabled?: boolean
}

interface FloatingDockProps {
  actions: DockAction[]
  size?: 'sm' | 'md' | 'lg'
  class?: string
  editMode?: boolean
}

const props = withDefaults(defineProps<FloatingDockProps>(), {
  size: 'md',
  editMode: false
})

const emit = defineEmits<{
  (e: 'action-click', actionId: string, event: MouseEvent): void
  (e: 'dock-show'): void
  (e: 'dock-hide'): void
}>()

// Initialize floating dock composable
const dock = useFloatingDock({
  autoHideDelay: 30000
})

const dockRef = ref<HTMLElement | null>(null)

// Handle action clicks
function handleActionClick(actionId: string, event: MouseEvent): void {
  emit('action-click', actionId, event)
  
  // Update interaction time to prevent auto-hide
  dock.updateInteractionTime()
}

// Handle drag start from handle only
function handleDragStart(event: MouseEvent | TouchEvent): void {
  const target = event.target as HTMLElement
  // Only start drag if the event originated from the drag handle
  if (target.closest('[data-drag-handle]')) {
    dock.startDrag(event)
  }
}

// Computed styles
const dockContainerClass = computed(() => {
  const sizeClasses = {
    sm: 'gap-1 px-2 py-1',
    md: 'gap-2 px-3 py-2',
    lg: 'gap-3 px-4 py-3'
  }
  
  return cn(
    // Base styles - Pill shape
    'fixed left-0 top-0 z-50 flex items-center',
    'bg-background/90 backdrop-blur-md',
    'border border-border/50 shadow-2xl',
    'rounded-full',
    'transition-all duration-300 ease-out',
    'select-none',
    // Hover effects
    'hover:bg-background/95 hover:shadow-3xl hover:scale-105',
    'hover:border-border/70',
    // Active state during drag
    {
      'scale-110 shadow-4xl bg-background/95': dock.isDragging.value
    },
    // Size classes
    sizeClasses[props.size],
    props.class
  )
})

const buttonSize = computed(() => {
  const buttonSizes = {
    sm: 'sm' as const,
    md: 'md' as const,
    lg: 'lg' as const
  }
  return buttonSizes[props.size]
})

// Watch for visibility changes to emit events
import { watch } from 'vue'

watch(dock.isVisible, (visible) => {
  if (visible) {
    emit('dock-show')
  } else {
    emit('dock-hide')
  }
})
</script>

<template>
  <Teleport to="body">
    <!-- Dock fade transition -->
    <Transition
      name="dock-fade"
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 scale-75"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-75"
    >
      <div
        v-if="dock.isVisible.value"
        ref="dockRef"
        :class="dockContainerClass"
        :style="dock.dockPosition.value"
        @mouseenter="dock.updateInteractionTime()"
        role="toolbar"
        aria-label="Floating dock"
      >
        <!-- Drag handle -->
        <div
          data-drag-handle
          class="flex items-center justify-center cursor-move touch-none select-none px-1 py-2 -ml-1 hover:text-muted-foreground transition-colors"
          @mousedown="handleDragStart"
          @touchstart="handleDragStart"
          :aria-label="'Drag to move dock'"
        >
          <GripVertical 
            :class="[
              'transition-all duration-200',
              dock.isDragging.value ? 'text-primary scale-110' : 'text-muted-foreground/50'
            ]"
            :size="size === 'sm' ? 14 : size === 'md' ? 16 : 20"
          />
        </div>
        
        <!-- Separator -->
        <div class="w-px h-6 bg-border/50 mx-1" />
        
        <!-- Dock buttons -->
        <DockButton
          v-for="action in actions"
          :key="action.id"
          :icon="action.icon"
          :active="action.active"
          :disabled="action.disabled"
          :size="buttonSize"
          @click="handleActionClick(action.id, $event)"
          :aria-label="action.label"
        />
        
        <!-- Drag handle indicator (optional visual cue) -->
        <div 
          class="absolute inset-0 rounded-full pointer-events-none"
          :class="{
            'ring-2 ring-primary/20 ring-offset-2 ring-offset-background/50': dock.isDragging.value
          }"
        />
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Custom shadows for enhanced depth */
.shadow-3xl {
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.05);
}

.shadow-4xl {
  box-shadow: 
    0 35px 60px -12px rgba(0, 0, 0, 0.35),
    0 0 0 1px rgba(255, 255, 255, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

/* Drag handle hover effect */
[data-drag-handle]:hover {
  opacity: 1;
}

[data-drag-handle]:active {
  transform: scale(0.95);
}

/* Dock fade transitions */
.dock-fade-enter-active,
.dock-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.dock-fade-enter-from,
.dock-fade-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(10px);
}

/* Smooth transform for dragging */
.floating-dock {
  will-change: transform;
}

/* Disable text selection during drag */
.floating-dock * {
  user-select: none;
  -webkit-user-select: none;
}
</style>