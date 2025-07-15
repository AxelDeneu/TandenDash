<template>
  <Button 
    v-bind="$attrs"
    :disabled="loading || disabled"
    :class="buttonClasses"
    @click="handleClick"
  >
    <LoadingSpinner 
      v-if="loading" 
      size="sm" 
      :variant="spinnerVariant"
      class="mr-2"
    />
    <slot />
  </Button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import LoadingSpinner from './LoadingSpinner.vue'

interface Props {
  loading?: boolean
  disabled?: boolean
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  disabled: false,
  variant: 'default'
})

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const buttonClasses = computed(() => [
  {
    'opacity-75 cursor-not-allowed': props.loading,
    'pointer-events-none': props.loading
  }
])

const spinnerVariant = computed(() => {
  switch (props.variant) {
    case 'destructive':
    case 'default':
      return 'secondary'
    case 'outline':
    case 'secondary':
    case 'ghost':
      return 'primary'
    default:
      return 'muted'
  }
})

function handleClick(event: MouseEvent): void {
  if (!props.loading && !props.disabled) {
    emit('click', event)
  }
}
</script>

<style scoped>
/* Additional button loading styles if needed */
</style>