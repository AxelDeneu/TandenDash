<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  modelValue?: string | number
  defaultValue?: string | number
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()

const emits = defineEmits<{
  'update:modelValue': [value: string]
}>()

const delegatedProps = computed(() => {
  const { modelValue: _, defaultValue: __, class: ___, ...delegated } = props
  return delegated
})

const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  emits('update:modelValue', target.value)
}
</script>

<template>
  <textarea
    v-bind="delegatedProps"
    :value="modelValue ?? defaultValue"
    @input="handleInput"
    :class="cn(
      'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      props.class
    )"
  />
</template>