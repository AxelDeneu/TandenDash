<script setup lang="ts">
import type { CheckboxRootEmits, CheckboxRootProps } from 'reka-ui'
import { cn } from '@/lib/utils'
import { Check } from '@/lib/icons'
import { CheckboxIndicator, CheckboxRoot, useForwardPropsEmits } from 'reka-ui'
import { computed, type HTMLAttributes } from 'vue'

interface TouchCheckboxProps extends CheckboxRootProps {
  class?: HTMLAttributes['class']
  size?: 'default' | 'large'
}

const props = withDefaults(defineProps<TouchCheckboxProps>(), {
  size: 'default'
})

const emits = defineEmits<CheckboxRootEmits>()

const delegatedProps = computed(() => {
  const { class: _, size: __, ...delegated } = props
  return delegated
})

const forwarded = useForwardPropsEmits(delegatedProps, emits)

const sizeClasses = computed(() => {
  return {
    default: {
      wrapper: 'h-12 w-12',
      checkbox: 'h-6 w-6',
      icon: 'h-5 w-5'
    },
    large: {
      wrapper: 'h-14 w-14',
      checkbox: 'h-8 w-8',
      icon: 'h-6 w-6'
    }
  }[props.size]
})
</script>

<template>
  <label :class="cn('inline-flex items-center justify-center cursor-pointer', sizeClasses.wrapper)">
    <CheckboxRoot
      v-bind="forwarded"
      :class="cn(
        'peer shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground transition-all',
        sizeClasses.checkbox,
        props.class
      )"
    >
      <CheckboxIndicator class="flex h-full w-full items-center justify-center text-current">
        <slot>
          <Check :class="sizeClasses.icon" />
        </slot>
      </CheckboxIndicator>
    </CheckboxRoot>
  </label>
</template>