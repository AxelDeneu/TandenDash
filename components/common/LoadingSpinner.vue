<template>
  <div :class="containerClasses">
    <div :class="spinnerClasses">
      <div class="animate-spin rounded-full border-solid border-t-transparent" :class="borderClasses"></div>
    </div>
    <div v-if="message" :class="messageClasses">
      {{ message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  message?: string
  overlay?: boolean
  center?: boolean
  variant?: 'primary' | 'secondary' | 'muted'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  overlay: false,
  center: true,
  variant: 'primary'
})

const containerClasses = computed(() => [
  'loading-container',
  {
    'flex flex-col items-center justify-center': props.center,
    'fixed inset-0 bg-background/80 backdrop-blur-sm z-50': props.overlay,
    'space-y-2': props.message
  }
])

const spinnerClasses = computed(() => [
  'loading-spinner',
  {
    'w-4 h-4': props.size === 'sm',
    'w-6 h-6': props.size === 'md',
    'w-8 h-8': props.size === 'lg',
    'w-12 h-12': props.size === 'xl'
  }
])

const borderClasses = computed(() => [
  'w-full h-full border-2',
  {
    'border-primary': props.variant === 'primary',
    'border-secondary': props.variant === 'secondary',
    'border-muted-foreground': props.variant === 'muted'
  }
])

const messageClasses = computed(() => [
  'loading-message text-sm',
  {
    'text-primary': props.variant === 'primary',
    'text-secondary': props.variant === 'secondary',
    'text-muted-foreground': props.variant === 'muted'
  }
])
</script>

<style scoped>
.loading-container {
  @apply w-full h-full;
}

.loading-spinner {
  @apply flex-shrink-0;
}

.loading-message {
  @apply text-center;
}
</style>