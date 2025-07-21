<script setup lang="ts">
import { ref, computed, watch } from 'vue'
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
import type { CalendarEvent } from '../types'

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

const modalTitle = computed(() => isEditMode.value ? 'Edit Event' : 'New Event')

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
  if (confirm('Are you sure you want to delete this event?')) {
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
          {{ isEditMode ? 'Make changes to your event' : 'Add a new event to your calendar' }}
        </DialogDescription>
      </DialogHeader>
      
      <div class="space-y-4 py-4">
        <!-- Title -->
        <div class="space-y-2">
          <Label for="title">Title</Label>
          <Input
            id="title"
            v-model="formData.title"
            placeholder="Event title"
            required
          />
        </div>
        
        <!-- Description -->
        <div class="space-y-2">
          <Label for="description">Description</Label>
          <Textarea
            id="description"
            v-model="formData.description"
            placeholder="Event description (optional)"
            rows="3"
          />
        </div>
        
        <!-- Location -->
        <div class="space-y-2">
          <Label for="location">Location</Label>
          <Input
            id="location"
            v-model="formData.location"
            placeholder="Event location (optional)"
          />
        </div>
        
        <!-- All day toggle -->
        <div class="flex items-center space-x-2">
          <Switch
            id="all-day"
            v-model:checked="formData.allDay"
          />
          <Label for="all-day">All day event</Label>
        </div>
        
        <!-- Date and time -->
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="start-date">Start date</Label>
            <Input
              id="start-date"
              type="date"
              v-model="formData.startDate"
              required
            />
          </div>
          <div class="space-y-2" v-if="!formData.allDay">
            <Label for="start-time">Start time</Label>
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
            <Label for="end-date">End date</Label>
            <Input
              id="end-date"
              type="date"
              v-model="formData.endDate"
              required
            />
          </div>
          <div class="space-y-2" v-if="!formData.allDay">
            <Label for="end-time">End time</Label>
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
          <Label for="category">Category</Label>
          <Select v-model="formData.category">
            <SelectTrigger id="category">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
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
          <Label>Color</Label>
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
          Delete
        </Button>
        <Button variant="outline" @click="closeModal">
          Cancel
        </Button>
        <Button @click="handleSave" :disabled="!isValid">
          {{ isEditMode ? 'Save Changes' : 'Create Event' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>