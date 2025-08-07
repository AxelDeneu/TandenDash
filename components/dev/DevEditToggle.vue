<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { Button } from '@/components/ui/button'
import { Edit, Check } from 'lucide-vue-next'
import { useDevelopment, useWidgetEventBus } from '@/composables'
import { cn } from '@/lib/utils'

const { isDevelopment } = useDevelopment()
const eventBus = useWidgetEventBus()

// Track edit mode state locally
const isEditMode = ref(false)

// Only render in development mode
const shouldRender = computed(() => isDevelopment)

// Icon based on edit mode state
const CurrentIcon = computed(() => isEditMode.value ? Check : Edit)

// Button label
const buttonLabel = computed(() => 
  isEditMode.value 
    ? 'dev.editModeActive' 
    : 'dev.toggleEditMode'
)

// Toggle edit mode via event bus
const toggleEditMode = () => {
  eventBus.emit('dev:toggleEditMode')
}

// Listen for edit mode changes
const handleEditModeChange = (enabled: boolean) => {
  isEditMode.value = enabled
}

onMounted(() => {
  eventBus.on('editMode:changed', handleEditModeChange)
})

onUnmounted(() => {
  eventBus.off('editMode:changed', handleEditModeChange)
})
</script>

<template>
  <Teleport to="body" v-if="shouldRender">
    <div class="dev-edit-toggle">
      <Button
        size="icon"
        variant="outline"
        @click="toggleEditMode"
        :class="cn(
          'dev-toggle-button',
          isEditMode && 'active'
        )"
        :title="$t(buttonLabel)"
      >
        <component :is="CurrentIcon" class="h-4 w-4" />
      </Button>
    </div>
  </Teleport>
</template>

<style scoped>
.dev-edit-toggle {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
}

.dev-toggle-button {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dev-toggle-button:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.dev-toggle-button.active {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.3);
  color: rgb(34, 197, 94);
}

:global(.dark) .dev-toggle-button {
  background: rgba(0, 0, 0, 0.8);
  border-color: rgba(255, 255, 255, 0.2);
}

:global(.dark) .dev-toggle-button:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

:global(.dark) .dev-toggle-button.active {
  background: rgba(34, 197, 94, 0.2);
  border-color: rgba(34, 197, 94, 0.5);
}

/* Responsive adjustments for touch screens */
@media (max-width: 768px) {
  .dev-edit-toggle {
    top: 0.75rem;
    right: 0.75rem;
  }
  
  .dev-toggle-button {
    width: 44px;
    height: 44px;
  }
}
</style>