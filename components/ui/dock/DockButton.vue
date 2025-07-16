<script setup lang="ts">
import { computed, ref } from 'vue'
import { Button } from '@/components/ui/button'
import TouchRipple from '@/components/common/TouchRipple.vue'
import { cn } from '@/lib/utils'
import * as Icons from '@/lib/icons'

interface DockButtonProps {
  icon: keyof typeof Icons
  active?: boolean
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  class?: string
}

const props = withDefaults(defineProps<DockButtonProps>(), {
  active: false,
  disabled: false,
  size: 'md'
})

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const rippleRef = ref<InstanceType<typeof TouchRipple> | null>(null)

const IconComponent = computed(() => {
  return Icons[props.icon]
})

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
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  }
  
  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5', 
    lg: 'h-6 w-6'
  }
  
  return cn(
    // Base styles
    'relative overflow-hidden rounded-full transition-all duration-200',
    'flex items-center justify-center',
    'active:scale-95',
    'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
    // Size classes
    sizeClasses[props.size],
    // State classes
    {
      'bg-primary text-primary-foreground shadow-md': props.active,
      'bg-background/50 text-muted-foreground hover:bg-background/80 hover:text-foreground': !props.active,
      'opacity-50 cursor-not-allowed': props.disabled,
    },
    props.class
  )
})

const iconClass = computed(() => {
  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }
  
  return cn(
    'transition-transform duration-200',
    iconSizes[props.size],
    {
      'scale-110': props.active
    }
  )
})
</script>

<template>
  <TouchRipple ref="rippleRef">
    <button
      :class="buttonClass"
      :disabled="disabled"
      @mousedown="handleInteraction"
      @touchstart="handleInteraction"
      @click="handleClick"
      type="button"
    >
      <component 
        :is="IconComponent" 
        :class="iconClass"
      />
    </button>
  </TouchRipple>
</template>