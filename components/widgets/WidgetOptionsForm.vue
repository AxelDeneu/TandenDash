<script setup lang="ts">
// Vue imports
import { computed } from 'vue'

// UI component imports
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import EnhancedWidgetOptionsForm from './EnhancedWidgetOptionsForm.vue'
import type { EnhancedWidgetConfig } from '@/types/widget-options'

type Props = {
  optionsDef: Record<string, any>
  modelValue: Record<string, any>
  enhancedConfig?: EnhancedWidgetConfig
  widgetType?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, any>]
}>()

// Use enhanced config if available
const useEnhanced = computed(() => !!props.enhancedConfig)

const optionKeys = computed(() => Object.keys(props.optionsDef))

const getOptionType = (key: string) => {
  const value = props.optionsDef[key];
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (Array.isArray(value)) return 'enum';
  return 'string';
};

// Filter out sensitive fields that shouldn't be displayed
const filteredOptionKeys = computed(() => 
  optionKeys.value.filter(key => key !== 'apiKey')
);

const handleChange = (key: string, value: any) => {
  emit('update:modelValue', { ...props.modelValue, [key]: value });
};
</script>
<template>
  <!-- Enhanced form when enhanced config is available -->
  <div v-if="useEnhanced && enhancedConfig">
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <span>{{ widgetType }} Configuration</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <EnhancedWidgetOptionsForm
          :config="enhancedConfig"
          :model-value="modelValue"
          :widget-type="widgetType"
          @update:model-value="$emit('update:modelValue', $event)"
        />
      </CardContent>
    </Card>
  </div>

  <!-- Fallback to legacy form -->
  <div v-else class="space-y-4">
    <div v-for="key in filteredOptionKeys" :key="key" class="flex flex-col gap-2">
      <Label class="block capitalize">{{ key }}</Label>
      <template v-if="getOptionType(key) === 'boolean'">
        <Switch v-model:modelValue="modelValue[key]" @update:checked="val => handleChange(key, val)" />
      </template>
      <template v-else-if="getOptionType(key) === 'string'">
        <Input v-model="modelValue[key]" @input="e => handleChange(key, e.target.value)" />
      </template>
      <template v-else-if="getOptionType(key) === 'number'">
        <Input type="number" v-model="modelValue[key]" @input="e => handleChange(key, Number(e.target.value))" />
      </template>
      <template v-else-if="getOptionType(key) === 'enum'">
        <Select v-model:modelValue="modelValue[key]" @update:modelValue="val => handleChange(key, val)">
          <SelectTrigger class="w-full">
            <SelectValue :placeholder="optionsDef[key][0]" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="option in optionsDef[key]" :key="option" :value="option">{{ option }}</SelectItem>
          </SelectContent>
        </Select>
      </template>
    </div>
  </div>
</template> 