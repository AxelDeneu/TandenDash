<script setup lang="ts">
import { computed } from 'vue'
import TouchButton from '@/components/ui/button/TouchButton.vue'
import { Edit, Plus, Settings } from '@/lib/icons'

const props = defineProps<{
  editMode: boolean
  currentPageIndex: number
  totalPages: number
  canAddWidget: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle-edit-mode'): void
  (e: 'add-widget'): void
  (e: 'go-to-page', index: number): void
  (e: 'open-settings'): void
}>()

const pageIndicators = computed(() => {
  return Array.from({ length: props.totalPages }, (_, i) => i)
})
</script>

<template>
  <div class="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t shadow-lg z-40">
    <div class="flex items-center justify-between px-4 py-2 gap-4">
      <!-- Left section - Page indicators -->
      <div class="flex items-center gap-2">
        <div class="flex gap-1">
          <button
            v-for="index in pageIndicators"
            :key="index"
            class="w-2 h-2 rounded-full transition-all"
            :class="index === currentPageIndex ? 'bg-primary w-6' : 'bg-muted-foreground/30'"
            @click="emit('go-to-page', index)"
            :aria-label="`Go to page ${index + 1}`"
          />
        </div>
      </div>

      <!-- Center section - Main actions -->
      <div class="flex items-center gap-2">
        <TouchButton 
          size="touch-icon"
          :variant="editMode ? 'default' : 'outline'"
          @click="emit('toggle-edit-mode')"
          :aria-label="editMode ? 'Exit edit mode' : 'Enter edit mode'"
        >
          <Edit class="h-6 w-6" />
        </TouchButton>

        <TouchButton 
          v-if="editMode && canAddWidget"
          size="touch-icon"
          variant="default"
          @click="emit('add-widget')"
          aria-label="Add widget"
        >
          <Plus class="h-6 w-6" />
        </TouchButton>

        <TouchButton 
          size="touch-icon"
          variant="outline"
          @click="emit('open-settings')"
          aria-label="Settings"
        >
          <Settings class="h-6 w-6" />
        </TouchButton>
      </div>

      <!-- Right section - Page count -->
      <div class="text-sm text-muted-foreground min-w-[60px] text-right">
        {{ currentPageIndex + 1 }} / {{ totalPages }}
      </div>
    </div>

    <!-- Edit mode indicator -->
    <Transition
      enter-active-class="transition-all duration-300"
      enter-from-class="h-0 opacity-0"
      enter-to-class="h-8 opacity-100"
      leave-active-class="transition-all duration-300"
      leave-from-class="h-8 opacity-100"
      leave-to-class="h-0 opacity-0"
    >
      <div v-if="editMode" class="bg-primary/10 text-primary text-center py-1 text-sm font-medium">
        Edit Mode Active - Drag widgets to reposition
      </div>
    </Transition>
  </div>
</template>