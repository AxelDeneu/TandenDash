<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import { useVModel } from '@vueuse/core'

interface TouchInputProps {
  defaultValue?: string | number
  modelValue?: string | number
  class?: HTMLAttributes['class']
  size?: 'default' | 'large'
}

const props = withDefaults(defineProps<TouchInputProps>(), {
  size: 'default'
})

const emits = defineEmits<{
  (e: 'update:modelValue', payload: string | number): void
}>()

const modelValue = useVModel(props, 'modelValue', emits, {
  passive: true,
  defaultValue: props.defaultValue,
})

const sizeClasses = {
  default: 'h-12 px-4 py-3 text-base',
  large: 'h-14 px-5 py-4 text-lg'
}
</script>

<template>
  <input 
    v-model="modelValue" 
    :class="cn(
      'flex w-full rounded-md border border-input bg-transparent shadow-sm transition-colors file:border-0 file:bg-transparent file:text-base file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
      sizeClasses[size],
      props.class
    )"
  >
</template>