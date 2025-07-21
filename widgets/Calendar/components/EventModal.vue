<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { format, addHours } from 'date-fns'
import { useWidgetI18n } from '@/composables/i18n/useWidgetI18n'
import type { CalendarEvent } from '../types'
import translations from '../lang/index'

interface Props {
  modelValue: boolean
  event?: CalendarEvent | null
  initialDate?: Date
  categories?: string[]
  eventColors?: string[]
  defaultDuration?: number
  defaultColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  defaultDuration: 60,
  defaultColor: '#3b82f6'
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'save': [event: Partial<CalendarEvent>]
  'delete': []
}>()

// Merge translations immediately
const { mergeLocaleMessage } = useI18n()
Object.entries(translations).forEach(([lang, messages]) => {
  mergeLocaleMessage(lang, { widget_Calendar: messages })
})

// i18n
const { t } = useWidgetI18n({ widgetName: 'Calendar', fallbackLocale: 'en' })

// Form data
const formData = ref({
  title: '',
  description: '',
  location: '',
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  allDay: false,
  color: props.defaultColor,
  category: 'none'
})

// Computed values
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isEditMode = computed(() => !!props.event)

const modalTitle = computed(() => isEditMode.value ? t('event.editEvent') : t('event.newEvent'))

// Initialize form when modal opens
function initializeForm() {
  if (props.event) {
    const start = new Date(props.event.startDate)
    const end = new Date(props.event.endDate)
    
    formData.value = {
      title: props.event.title,
      description: props.event.description || '',
      location: props.event.location || '',
      startDate: format(start, 'yyyy-MM-dd'),
      startTime: format(start, 'HH:mm'),
      endDate: format(end, 'yyyy-MM-dd'),
      endTime: format(end, 'HH:mm'),
      allDay: props.event.allDay,
      color: props.event.color || props.defaultColor,
      category: props.event.category || 'none'
    }
  } else if (props.initialDate) {
    // New event with initial date
    const start = new Date(props.initialDate)
    const end = addHours(start, props.defaultDuration / 60)
    
    formData.value = {
      title: '',
      description: '',
      location: '',
      startDate: format(start, 'yyyy-MM-dd'),
      startTime: format(start, 'HH:mm'),
      endDate: format(end, 'yyyy-MM-dd'),
      endTime: format(end, 'HH:mm'),
      allDay: false,
      color: props.defaultColor,
      category: 'none'
    }
  } else {
    // Default new event
    const start = new Date()
    const end = addHours(start, props.defaultDuration / 60)
    
    formData.value = {
      title: '',
      description: '',
      location: '',
      startDate: format(start, 'yyyy-MM-dd'),
      startTime: format(start, 'HH:mm'),
      endDate: format(end, 'yyyy-MM-dd'),
      endTime: format(end, 'HH:mm'),
      allDay: false,
      color: props.defaultColor,
      category: 'none'
    }
  }
}

// Watch for modal opening
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    initializeForm()
  }
})

// Handle all day toggle
watch(() => formData.value.allDay, (allDay) => {
  if (allDay) {
    formData.value.startTime = '00:00'
    formData.value.endTime = '23:59'
  }
})

// Validation
const isValid = computed(() => {
  return formData.value.title.trim() !== '' &&
         formData.value.startDate !== '' &&
         formData.value.endDate !== ''
})

// Save event
function handleSave() {
  if (!isValid.value) return
  
  const startDateTime = `${formData.value.startDate}T${formData.value.startTime}:00`
  const endDateTime = `${formData.value.endDate}T${formData.value.endTime}:00`
  
  const eventData: Partial<CalendarEvent> = {
    title: formData.value.title.trim(),
    description: formData.value.description.trim(),
    location: formData.value.location.trim(),
    startDate: startDateTime,
    endDate: endDateTime,
    allDay: formData.value.allDay,
    color: formData.value.color,
    category: formData.value.category === 'none' ? '' : formData.value.category
  }
  
  if (isEditMode.value && props.event) {
    eventData.id = props.event.id
  }
  
  emit('save', eventData)
  closeModal()
}

// Delete event
function handleDelete() {
  if (confirm(t('event.confirmDelete'))) {
    emit('delete')
    closeModal()
  }
}

// Close modal
function closeModal() {
  isOpen.value = false
  // Reset form after animation
  setTimeout(() => {
    formData.value = {
      title: '',
      description: '',
      location: '',
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
      allDay: false,
      color: props.defaultColor,
      category: 'none'
    }
  }, 200)
}
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>{{ modalTitle }}</DialogTitle>
        <DialogDescription>
          {{ isEditMode ? t('event.makeChanges') : t('event.addNew') }}
        </DialogDescription>
      </DialogHeader>
      
      <div class="space-y-4 py-4">
        <!-- Title -->
        <div class="space-y-2">
          <Label for="title">{{ t('form.title') }}</Label>
          <Input
            id="title"
            v-model="formData.title"
            :placeholder="t('placeholders.eventTitle')"
            required
          />
        </div>
        
        <!-- Description -->
        <div class="space-y-2">
          <Label for="description">{{ t('form.description') }}</Label>
          <Textarea
            id="description"
            v-model="formData.description"
            :placeholder="t('placeholders.eventDescription')"
            rows="3"
          />
        </div>
        
        <!-- Location -->
        <div class="space-y-2">
          <Label for="location">{{ t('form.location') }}</Label>
          <Input
            id="location"
            v-model="formData.location"
            :placeholder="t('placeholders.eventLocation')"
          />
        </div>
        
        <!-- All day toggle -->
        <div class="flex items-center space-x-2">
          <Switch
            id="all-day"
            v-model:checked="formData.allDay"
          />
          <Label for="all-day">{{ t('form.allDay') }}</Label>
        </div>
        
        <!-- Date and time -->
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="start-date">{{ t('form.startDate') }}</Label>
            <Input
              id="start-date"
              type="date"
              v-model="formData.startDate"
              required
            />
          </div>
          <div class="space-y-2" v-if="!formData.allDay">
            <Label for="start-time">{{ t('form.startTime') }}</Label>
            <Input
              id="start-time"
              type="time"
              v-model="formData.startTime"
              required
            />
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="end-date">{{ t('form.endDate') }}</Label>
            <Input
              id="end-date"
              type="date"
              v-model="formData.endDate"
              required
            />
          </div>
          <div class="space-y-2" v-if="!formData.allDay">
            <Label for="end-time">{{ t('form.endTime') }}</Label>
            <Input
              id="end-time"
              type="time"
              v-model="formData.endTime"
              required
            />
          </div>
        </div>
        
        <!-- Category -->
        <div class="space-y-2" v-if="categories && categories.length > 0">
          <Label for="category">{{ t('form.category') }}</Label>
          <Select v-model="formData.category">
            <SelectTrigger id="category">
              <SelectValue :placeholder="t('form.selectCategory')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{{ t('form.none') }}</SelectItem>
              <SelectItem 
                v-for="category in categories" 
                :key="category"
                :value="category"
              >
                {{ category }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <!-- Color -->
        <div class="space-y-2">
          <Label>{{ t('form.color') }}</Label>
          <div class="flex gap-2">
            <button
              v-for="color in (eventColors || ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'])"
              :key="color"
              class="w-8 h-8 rounded-md border-2"
              :class="formData.color === color ? 'border-primary' : 'border-transparent'"
              :style="{ backgroundColor: color }"
              @click="formData.color = color"
            />
          </div>
        </div>
      </div>
      
      <DialogFooter>
        <Button
          v-if="isEditMode"
          variant="destructive"
          @click="handleDelete"
        >
          {{ t('event.deleteEvent') }}
        </Button>
        <Button variant="outline" @click="closeModal">
          {{ t('form.cancel') }}
        </Button>
        <Button @click="handleSave" :disabled="!isValid">
          {{ isEditMode ? t('event.saveChanges') : t('event.createEvent') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>