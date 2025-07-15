<template>
  <div v-if="shouldShow" class="space-y-2">
    <Label :for="fieldId" class="text-sm font-medium">
      {{ definition.label }}
    </Label>
    
    <p v-if="definition.description" class="text-xs text-muted-foreground">
      {{ definition.description }}
    </p>

    <!-- Toggle/Switch -->
    <div v-if="definition.type === 'toggle'" class="flex items-center space-x-2">
      <Switch 
        :id="fieldId"
        :model-value="modelValue"
        @update:model-value="$emit('update:modelValue', $event)"
      />
      <Label :for="fieldId" class="text-sm">
        {{ definition.label }}
      </Label>
    </div>

    <!-- Text Input -->
    <Input
      v-else-if="definition.type === 'text'"
      :id="fieldId"
      type="text"
      :model-value="modelValue"
      :placeholder="definition.placeholder"
      @update:model-value="$emit('update:modelValue', $event)"
    />

    <!-- Color Input -->
    <div v-else-if="definition.type === 'color'" class="flex gap-2">
      <Input
        :id="fieldId"
        type="color"
        :model-value="modelValue"
        class="w-12 h-10 p-1 rounded border"
        @update:model-value="$emit('update:modelValue', $event)"
      />
      <Select 
        :model-value="modelValue" 
        @update:model-value="$emit('update:modelValue', $event)"
      >
        <SelectTrigger class="flex-1">
          <SelectValue placeholder="Choose a color..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem 
            v-for="option in effectiveOptions" 
            :key="option.value" 
            :value="option.value"
          >
            {{ option.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Select Dropdown -->
    <Select 
      v-else-if="definition.type === 'select'"
      :model-value="modelValue" 
      @update:model-value="$emit('update:modelValue', $event)"
    >
      <SelectTrigger :id="fieldId">
        <SelectValue :placeholder="getSelectPlaceholder()" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem 
          v-for="option in effectiveOptions" 
          :key="option.value" 
          :value="option.value"
        >
          <div class="flex flex-col">
            <span>{{ option.label }}</span>
            <span v-if="option.description" class="text-xs text-muted-foreground">
              {{ option.description }}
            </span>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>

    <!-- Radio Group -->
    <RadioGroup
      v-else-if="definition.type === 'radio'"
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
      class="grid grid-cols-1 gap-3"
    >
      <div 
        v-for="option in effectiveOptions" 
        :key="option.value"
        class="flex items-center space-x-2 border rounded-lg p-3 hover:bg-muted/50 transition-colors"
      >
        <RadioGroupItem :id="`${fieldId}-${option.value}`" :value="option.value" />
        <Label 
          :for="`${fieldId}-${option.value}`" 
          class="flex-1 cursor-pointer"
        >
          <div class="flex items-center gap-2">
            <component 
              v-if="option.icon" 
              :is="getIcon(option.icon)" 
              class="h-4 w-4" 
            />
            <div>
              <div class="font-medium">{{ option.label }}</div>
              <div v-if="option.description" class="text-xs text-muted-foreground">
                {{ option.description }}
              </div>
            </div>
          </div>
        </Label>
      </div>
    </RadioGroup>

    <!-- Checkbox Group -->
    <div v-else-if="definition.type === 'checkbox'" class="space-y-2">
      <!-- Action buttons if available -->
      <div v-if="definition.actions && definition.actions.length > 0" class="flex gap-2 mb-3">
        <Button
          v-for="action in definition.actions"
          :key="action.id"
          :variant="action.variant || 'outline'"
          size="sm"
          @click="handleAction(action)"
          class="gap-2"
        >
          <component 
            v-if="action.icon" 
            :is="getIcon(action.icon)" 
            class="h-4 w-4" 
          />
          {{ action.label }}
        </Button>
      </div>
      
      <!-- Loading state -->
      <div v-if="isLoadingOptions" class="text-sm text-muted-foreground">
        Loading options...
      </div>
      
      <!-- Checkbox options -->
      <template v-else>
        <div 
          v-for="option in effectiveOptions" 
          :key="option.value"
          class="flex items-center space-x-2"
        >
        <Checkbox 
          :id="`${fieldId}-${option.value}`"
          :model-value="Array.isArray(modelValue) && modelValue.includes(option.value)"
          @update:model-value="handleCheckboxChange(option.value, $event)"
        />
        <Label 
          :for="`${fieldId}-${option.value}`" 
          class="text-sm cursor-pointer flex-1"
        >
          <div>
            <div>{{ option.label }}</div>
            <div v-if="option.description" class="text-xs text-muted-foreground">
              {{ option.description }}
            </div>
          </div>
        </Label>
        </div>
      </template>
    </div>

    <!-- Slider -->
    <div v-else-if="definition.type === 'slider'" class="space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex-1">
          <Slider
            :id="fieldId"
            :model-value="[modelValue || definition.min || 0]"
            :min="definition.min || 0"
            :max="definition.max || 100"
            :step="definition.step || 1"
            @update:model-value="$emit('update:modelValue', $event[0])"
            class="flex-1"
          />
        </div>
        <div class="ml-4 flex items-center gap-1">
          <Input
            type="number"
            :model-value="modelValue || definition.min || 0"
            :min="definition.min"
            :max="definition.max"
            :step="definition.step || 1"
            @update:model-value="$emit('update:modelValue', Number($event))"
            class="w-20 text-center"
          />
          <span v-if="definition.unit" class="text-sm text-muted-foreground">
            {{ definition.unit }}
          </span>
        </div>
      </div>
      <div class="flex justify-between text-xs text-muted-foreground">
        <span>{{ definition.min }}{{ definition.unit || '' }}</span>
        <span>{{ definition.max }}{{ definition.unit || '' }}</span>
      </div>
    </div>

    <!-- Tags Input -->
    <TagsInput
      v-else-if="definition.type === 'tags'"
      :id="fieldId"
      :model-value="modelValue || []"
      @update:model-value="$emit('update:modelValue', $event)"
    >
      <TagsInputInput :placeholder="definition.placeholder || 'Add tag...'" />
    </TagsInput>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import type { WidgetOptionDefinition } from '@/types/widget-options'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { TagsInput, TagsInputInput } from '@/components/ui/tags-input'
import { Button } from '@/components/ui/button'
import { AlignVerticalJustifyCenter, AlignHorizontalJustifyCenter, Palette, Plus, Trash2 } from 'lucide-vue-next'

interface Props {
  fieldKey: string
  definition: WidgetOptionDefinition
  modelValue: any
  allValues: Record<string, any>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: any]
}>()

// Generate unique field ID
const fieldId = computed(() => `field-${props.fieldKey}`)

// Dynamic options for checkbox/select fields
const dynamicOptions = ref<any[]>([])
const isLoadingOptions = ref(false)

// Fetch dynamic options if dataFetcher is provided
const fetchDynamicOptions = async () => {
  if (props.definition.dataFetcher && ['checkbox', 'select', 'radio'].includes(props.definition.type)) {
    isLoadingOptions.value = true
    try {
      const options = await props.definition.dataFetcher()
      dynamicOptions.value = options
    } catch (error) {
      console.error(`Failed to fetch options for ${props.fieldKey}:`, error)
      dynamicOptions.value = []
    } finally {
      isLoadingOptions.value = false
    }
  }
}

// Use dynamic options if available, otherwise use static options
const effectiveOptions = computed(() => {
  if (dynamicOptions.value.length > 0) {
    return dynamicOptions.value
  }
  return props.definition.options || []
})

onMounted(() => {
  fetchDynamicOptions()
})

// Re-fetch options when dependencies change
watch(() => props.allValues, () => {
  if (shouldShow.value && props.definition.dataFetcher) {
    fetchDynamicOptions()
  }
}, { deep: true })

// Check if field should be shown based on dependencies
const shouldShow = computed(() => {
  if (!props.definition.dependencies) return true
  
  for (const [depKey, depValue] of Object.entries(props.definition.dependencies)) {
    if (props.allValues[depKey] !== depValue) {
      return false
    }
  }
  return true
})

// Get placeholder for select fields
const getSelectPlaceholder = () => {
  if (props.definition.placeholder) return props.definition.placeholder
  if (effectiveOptions.value?.length) return `Select ${props.definition.label.toLowerCase()}...`
  return 'Select an option...'
}

// Handle checkbox group changes
const handleCheckboxChange = (value: any, checked: boolean) => {
  const currentValues = Array.isArray(props.modelValue) ? [...props.modelValue] : []
  
  if (checked) {
    if (!currentValues.includes(value)) {
      currentValues.push(value)
    }
  } else {
    const index = currentValues.indexOf(value)
    if (index > -1) {
      currentValues.splice(index, 1)
    }
  }
  
  emit('update:modelValue', currentValues)
}

// Handle action button clicks
const handleAction = async (action: any) => {
  if (!action.handler) return
  
  if (action.confirmMessage && !confirm(action.confirmMessage)) {
    return
  }
  
  const context = {
    selectedValues: props.modelValue,
    updateValue: (value: any) => emit('update:modelValue', value),
    refreshOptions: async () => {
      await fetchDynamicOptions()
    },
    allValues: props.allValues
  }
  
  await action.handler(context)
}

// Get icon component
const getIcon = (iconName: string) => {
  const icons: Record<string, any> = {
    AlignVertical: AlignVerticalJustifyCenter,
    AlignHorizontal: AlignHorizontalJustifyCenter,
    Palette,
    Plus,
    Trash2
  }
  return icons[iconName]
}
</script>