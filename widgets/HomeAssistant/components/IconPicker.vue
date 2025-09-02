<script setup lang="ts">
import { ref, computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Search, Check } from 'lucide-vue-next'
import { AVAILABLE_ICONS, type AvailableIcon } from '../types/entity-config'
import { WidgetPlugin } from '../plugin'

// Import all the icons dynamically
import * as LucideIcons from 'lucide-vue-next'

const props = defineProps<{
  open: boolean
  selectedIcon: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'select': [icon: string]
}>()

// i18n
const { t } = useWidgetI18n(WidgetPlugin.id)

// State
const searchQuery = ref('')
const selectedIconLocal = ref(props.selectedIcon)

// Filter icons based on search
const filteredIcons = computed(() => {
  if (!searchQuery.value) return AVAILABLE_ICONS
  
  const query = searchQuery.value.toLowerCase()
  return AVAILABLE_ICONS.filter(icon => 
    icon.toLowerCase().includes(query)
  )
})

// Get icon component dynamically
const getIconComponent = (iconName: string) => {
  return (LucideIcons as any)[iconName] || LucideIcons.HelpCircle
}

// Icon categories for better organization
const iconCategories = computed(() => {
  const categories: Record<string, AvailableIcon[]> = {
    home: ['Home', 'Lightbulb', 'Power', 'Lock', 'Unlock', 'Camera', 'Shield', 'Bell'],
    climate: ['Thermometer', 'Sun', 'Moon', 'Cloud', 'CloudRain', 'Snowflake', 'Wind', 'Fan'],
    media: ['Play', 'Pause', 'Volume2', 'VolumeX', 'Camera', 'Radio', 'Headphones'],
    sensors: ['Activity', 'Heart', 'Zap', 'Battery', 'Wifi', 'Radio', 'Eye'],
    navigation: ['MapPin', 'Navigation', 'Compass', 'Map', 'Car', 'Bike'],
    controls: ['Settings', 'MoreVertical', 'Plus', 'Minus', 'Check', 'X'],
    misc: ['Timer', 'Clock', 'Calendar', 'Cpu', 'HardDrive']
  }
  
  // If search is active, return filtered results without categories
  if (searchQuery.value) {
    return { all: filteredIcons.value }
  }
  
  return categories
})

const selectIcon = (icon: string) => {
  selectedIconLocal.value = icon
  emit('select', icon)
  emit('update:open', false)
}

const handleClose = () => {
  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="max-w-2xl max-h-[80vh]">
      <DialogHeader>
        <DialogTitle>{{ t('iconPicker.title') }}</DialogTitle>
      </DialogHeader>

      <!-- Search -->
      <div class="relative mb-4">
        <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          v-model="searchQuery"
          :placeholder="t('iconPicker.searchPlaceholder')"
          class="pl-10"
        />
      </div>

      <!-- Selected icon preview -->
      <div class="flex items-center gap-3 mb-4 p-3 bg-muted/50 rounded-lg">
        <Label class="text-sm font-medium">{{ t('iconPicker.selected') }}:</Label>
        <div class="flex items-center gap-2">
          <component :is="getIconComponent(selectedIconLocal)" class="w-5 h-5" />
          <span class="text-sm">{{ selectedIconLocal }}</span>
        </div>
      </div>

      <!-- Icons grid -->
      <ScrollArea class="h-96">
        <div class="space-y-6">
          <template v-for="(icons, categoryName) in iconCategories" :key="categoryName">
            <div v-if="icons.length > 0">
              <h4 v-if="!searchQuery" class="text-sm font-medium mb-3 capitalize">
                {{ t(`iconPicker.categories.${categoryName}`) }}
              </h4>
              
              <div class="grid grid-cols-8 gap-2">
                <Button
                  v-for="icon in icons"
                  :key="icon"
                  @click="selectIcon(icon)"
                  variant="ghost"
                  size="sm"
                  :class="[
                    'relative h-12 w-12 p-0 hover:bg-accent',
                    selectedIconLocal === icon && 'bg-primary/10 border-2 border-primary'
                  ]"
                  :title="icon"
                >
                  <component :is="getIconComponent(icon)" class="w-5 h-5" />
                  
                  <!-- Selection indicator -->
                  <Check 
                    v-if="selectedIconLocal === icon"
                    class="absolute -top-1 -right-1 w-3 h-3 text-primary bg-background rounded-full"
                  />
                </Button>
              </div>
            </div>
          </template>
        </div>
      </ScrollArea>

      <DialogFooter>
        <Button variant="outline" @click="handleClose">
          {{ t('common.cancel') }}
        </Button>
        <Button @click="() => selectIcon(selectedIconLocal)">
          {{ t('common.select') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
/* Custom scrollbar for the icon grid */
:deep(.scroll-area-viewport) {
  scrollbar-width: thin;
}
</style>