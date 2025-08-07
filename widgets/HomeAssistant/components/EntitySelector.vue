<script setup lang="ts">
import { ref, computed } from 'vue'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-vue-next'
import type { HassEntity } from 'home-assistant-js-websocket'
import { WidgetPlugin } from '../plugin'

const props = defineProps<{
  entities: HassEntity[]
  selectedId?: string
}>()

const emit = defineEmits<{
  select: [entityId: string]
  close: []
}>()

// State
const searchQuery = ref('')

// Group entities by domain
const groupedEntities = computed(() => {
  const groups: Record<string, HassEntity[]> = {}
  
  const filtered = props.entities.filter(entity => {
    if (!searchQuery.value) return true
    
    const query = searchQuery.value.toLowerCase()
    const friendlyName = entity.attributes.friendly_name?.toLowerCase() || ''
    const entityId = entity.entity_id.toLowerCase()
    
    return friendlyName.includes(query) || entityId.includes(query)
  })
  
  filtered.forEach(entity => {
    const domain = entity.entity_id.split('.')[0]
    if (!groups[domain]) {
      groups[domain] = []
    }
    groups[domain].push(entity)
  })
  
  return groups
})

// Get i18n instance
const { t } = useWidgetI18n(WidgetPlugin.id)

// Get domain display name
const getDomainName = (domain: string): string => {
  const key = `domains.${domain}`
  
  // Check if translation exists
  try {
    const translation = t(key)
    // If the translation is the same as the key, it means it doesn't exist
    if (translation === key) {
      return domain.charAt(0).toUpperCase() + domain.slice(1)
    }
    return translation
  } catch {
    return domain.charAt(0).toUpperCase() + domain.slice(1)
  }
}

// Handle selection
const handleSelect = (entityId: string) => {
  emit('select', entityId)
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Search bar -->
    <div class="relative mb-4">
      <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        v-model="searchQuery"
        :placeholder="t('actions.search')"
        class="pl-9 pr-9"
      />
      <Button
        v-if="searchQuery"
        variant="ghost"
        size="icon"
        class="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
        @click="searchQuery = ''"
      >
        <X class="h-3 w-3" />
      </Button>
    </div>
    
    <!-- Entity list -->
    <div class="overflow-y-scroll flex-[1_1_auto]">
      <div v-for="(entities, domain) in groupedEntities" :key="domain" class="mb-6">
        <h3 class="text-sm font-medium text-muted-foreground mb-2">
          {{ getDomainName(domain) }}
        </h3>
        
        <div class="space-y-1">
          <button
            v-for="entity in entities"
            :key="entity.entity_id"
            class="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors"
            :class="{
              'bg-accent': entity.entity_id === selectedId
            }"
            @click="handleSelect(entity.entity_id)"
          >
            <div class="font-medium text-sm">
              {{ entity.attributes.friendly_name || entity.entity_id }}
            </div>
            <div class="text-xs text-muted-foreground">
              {{ entity.entity_id }} · {{ entity.state }}
            </div>
          </button>
        </div>
      </div>
      
      <!-- No results -->
      <div v-if="Object.keys(groupedEntities).length === 0" class="text-center py-8">
        <p class="text-sm text-muted-foreground">
          {{ t('common.noResults') }}
        </p>
      </div>
    </div>
    
    <!-- Close button -->
    <div class="pt-4 border-t">
      <Button
        variant="outline"
        class="w-full"
        @click="emit('close')"
      >
        {{ t('actions.cancel') }}
      </Button>
    </div>
  </div>
</template>