<template>
  <Transition
    enter-active-class="transition-opacity duration-500 delay-1000"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-300"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div 
      v-if="show"
      class="toolbar-hint"
      @click="$emit('click')"
    >
      <div class="hint-content">
        <span class="hint-text">{{ hintText }}</span>
        <kbd class="hint-key">{{ isTouchDevice ? '4 fingers' : 'Middle Click' }}</kbd>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

interface Props {
  show: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  click: []
}>()

const isTouchDevice = ref(false)

onMounted(() => {
  // Detect touch device
  isTouchDevice.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0
})

const hintText = computed(() => 
  isTouchDevice.value ? 'Hold' : 'Press'
)
</script>

<style scoped>
.toolbar-hint {
  @apply fixed bottom-4 left-1/2 transform -translate-x-1/2;
  @apply bg-background/80 backdrop-blur-sm border rounded-full;
  @apply px-4 py-2 cursor-pointer select-none;
  @apply hover:bg-background/95 transition-colors;
  z-index: 35; /* Below toolbar (z-40) */
}

.hint-content {
  @apply flex items-center gap-2 text-sm text-muted-foreground;
}

.hint-key {
  @apply px-2 py-1 bg-muted rounded text-xs font-mono;
}
</style>