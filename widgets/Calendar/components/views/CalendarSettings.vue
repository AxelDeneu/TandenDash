<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Settings, RefreshCw } from '@/lib/icons'
import type { WidgetConfig } from '../../definition'
import SyncStatus from '../SyncStatus.vue'
import type { SyncStatus as SyncStatusType } from '../../composables/useCalendarSync'

interface Props extends WidgetConfig {
  syncStatus?: SyncStatusType
  nextSyncTime?: Date | null
  canSync?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  sync: []
  'update:config': [config: Partial<WidgetConfig>]
}>()

const showSettings = ref(false)

// Local config state
const localConfig = ref({
  syncEnabled: props.syncEnabled,
  syncUrl: props.syncUrl || '',
  syncInterval: props.syncInterval
})

// Watch for prop changes
watch(() => props.syncEnabled, (val) => {
  localConfig.value.syncEnabled = val
})

watch(() => props.syncUrl, (val) => {
  localConfig.value.syncUrl = val || ''
})

watch(() => props.syncInterval, (val) => {
  localConfig.value.syncInterval = val
})

// Handle config updates
function updateConfig() {
  emit('update:config', {
    syncEnabled: localConfig.value.syncEnabled,
    syncUrl: localConfig.value.syncUrl,
    syncInterval: localConfig.value.syncInterval
  })
  showSettings.value = false
}

// Handle sync button
function handleSync() {
  emit('sync')
}
</script>

<template>
  <div class="relative">
    <!-- Settings Toggle -->
    <button
      @click="showSettings = !showSettings"
      class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      title="Calendar settings"
    >
      <Settings class="w-5 h-5" />
    </button>
    
    <!-- Settings Dropdown -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="showSettings"
        class="absolute right-0 top-full mt-2 w-96 rounded-lg shadow-lg border bg-background p-4 space-y-4 z-50"
      >
        <h3 class="font-medium text-lg">Calendar Settings</h3>
        
        <!-- Sync Status -->
        <SyncStatus
          v-if="syncStatus && syncEnabled"
          :status="syncStatus"
          :next-sync-time="nextSyncTime || null"
          :can-sync="canSync || false"
          :font-size="fontSize"
          @sync="handleSync"
        />
        
        <!-- Sync Settings -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <label for="sync-enabled" class="text-sm font-medium">
              Enable Calendar Sync
            </label>
            <input
              id="sync-enabled"
              type="checkbox"
              v-model="localConfig.syncEnabled"
              class="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
          </div>
          
          <div v-if="localConfig.syncEnabled" class="space-y-3">
            <div>
              <label for="sync-url" class="block text-sm font-medium mb-1">
                iCal URL
              </label>
              <input
                id="sync-url"
                type="url"
                v-model="localConfig.syncUrl"
                placeholder="https://calendar.example.com/feed.ics"
                class="w-full px-3 py-2 border rounded-md text-sm focus:ring-primary focus:border-primary"
              />
            </div>
            
            <div>
              <label for="sync-interval" class="block text-sm font-medium mb-1">
                Sync Interval (minutes)
              </label>
              <input
                id="sync-interval"
                type="number"
                v-model.number="localConfig.syncInterval"
                min="5"
                max="1440"
                step="5"
                class="w-full px-3 py-2 border rounded-md text-sm focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
        </div>
        
        <!-- Actions -->
        <div class="flex justify-end gap-2 pt-2 border-t">
          <button
            @click="showSettings = false"
            class="px-3 py-1.5 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            @click="updateConfig"
            class="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>