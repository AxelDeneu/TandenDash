<template>
  <div class="space-y-6">
    <!-- Grouped options with accordion -->
    <Accordion 
      v-if="config.groups" 
      type="multiple" 
      :default-value="defaultOpenGroups"
      class="w-full"
    >
      <AccordionItem 
        v-for="group in config.groups" 
        :key="group.id" 
        :value="group.id"
      >
        <AccordionTrigger class="text-left">
          <div>
            <h3 class="font-medium">{{ resolveLabel(group.label) }}</h3>
            <p v-if="group.description" class="text-sm text-muted-foreground">
              {{ resolveLabel(group.description) }}
            </p>
          </div>
        </AccordionTrigger>
        <AccordionContent class="pt-4">
          <div class="space-y-4">
            <OptionField
              v-for="(optionDef, key) in group.options"
              :key="`${group.id}-${key}`"
              :field-key="key"
              :definition="optionDef"
              :model-value="modelValue[key]"
              :all-values="modelValue"
              @update:model-value="handleChange(key, $event)"
            />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>

    <!-- Ungrouped options -->
    <div v-if="config.ungrouped" class="space-y-4">
      <Separator v-if="config.groups?.length" />
      <h3 class="font-medium">{{ $t('widgets.additionalOptions') }}</h3>
      <div class="space-y-4">
        <OptionField
          v-for="(optionDef, key) in config.ungrouped"
          :key="`ungrouped-${key}`"
          :field-key="key"
          :definition="optionDef"
          :model-value="modelValue[key]"
          :all-values="modelValue"
          @update:model-value="handleChange(key, $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, provide } from 'vue'
import type { EnhancedWidgetConfig } from '@/types/widget-options'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Separator } from '@/components/ui/separator'
import OptionField from './OptionField.vue'
import { useI18n } from 'vue-i18n'

interface Props {
  config: EnhancedWidgetConfig
  modelValue: Record<string, any>
  widgetType?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, any>]
}>()

// Get i18n instance
const { t } = useI18n()

// Provide widget type to children
if (props.widgetType) {
  provide('widgetType', props.widgetType)
}

// Function to resolve labels with @ prefix as translation keys
const resolveLabel = (label: string | undefined): string => {
  if (!label) return ''
  
  if (label.startsWith('@')) {
    const key = label.substring(1)
    // Try widget-specific translation first
    if (props.widgetType) {
      const widgetKey = `widget_${props.widgetType}.${key}`
      const translation = t(widgetKey)
      // If translation is found (not the same as the key), return it
      if (translation !== widgetKey) {
        return translation
      }
    }
    // Fallback to global translation
    return t(key)
  }
  
  return label
}

// Get default open groups
const defaultOpenGroups = computed(() => {
  return props.config.groups
    ?.filter(group => group.defaultOpen)
    .map(group => group.id) || []
})

// Handle value changes
const handleChange = (key: string, value: any) => {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}
</script>