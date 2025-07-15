<script setup lang="ts">
import { computed, ref } from 'vue'
import { Button } from '@/components/ui/button'
import TouchRipple from '@/components/common/TouchRipple.vue'
import { cn } from '@/lib/utils'
import type { ButtonVariants } from './index'

interface TouchButtonProps {
  variant?: ButtonVariants['variant']
  size?: ButtonVariants['size']
  class?: string
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  loading?: boolean
}

const props = withDefaults(defineProps<TouchButtonProps>(), {
  type: 'button',
  variant: 'default',
  size: 'touch-default'
})

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const rippleRef = ref<InstanceType<typeof TouchRipple> | null>(null)

const handleInteraction = (event: MouseEvent | TouchEvent) => {
  if (!props.disabled && rippleRef.value) {
    rippleRef.value.addRipple(event)
  }
}

const handleClick = (event: MouseEvent) => {
  if (!props.disabled) {
    emit('click', event)
  }
}

const buttonClass = computed(() => {
  return cn(
    'relative overflow-hidden transition-transform active:scale-95',
    props.class
  )
})
</script>

<template>
  <TouchRipple ref="rippleRef">
    <Button
      :variant="variant"
      :size="size"
      :type="type"
      :disabled="disabled || loading"
      :class="buttonClass"
      @mousedown="handleInteraction"
      @touchstart="handleInteraction"
      @click="handleClick"
    >
      <slot />
    </Button>
  </TouchRipple>
</template>