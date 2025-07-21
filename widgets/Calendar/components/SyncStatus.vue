<script setup lang="ts">
import { computed } from 'vue'
import { RefreshCw, AlertTriangle, Check } from '@/lib/icons'
import { formatRelativeTime } from '../utils/date-helpers'
import type { SyncStatus } from '../composables/useCalendarSync'

interface Props {
  status: SyncStatus
  nextSyncTime: Date | null
  canSync: boolean
  fontSize: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  sync: []
}>()

// Format last sync time
const lastSyncText = computed(() => {
  if (!props.status.lastSync) return 'Never synced'
  return formatRelativeTime(props.status.lastSync)
})

// Format next sync time
const nextSyncText = computed(() => {
  if (!props.nextSyncTime) return ''
  return `Next sync ${formatRelativeTime(props.nextSyncTime)}`
})

// Status icon and color
const statusIcon = computed(() => {
  if (props.status.syncing) return RefreshCw
  if (props.status.error) return AlertTriangle
  return Check
})

const statusColor = computed(() => {
  if (props.status.error) return 'text-red-500'
  if (props.status.syncing) return 'text-blue-500'
  return 'text-green-500'
})
</script>

<template>
  <div 
    class="flex items-center gap-3 p-4 rounded-lg border bg-card"
    :style="{ fontSize: `${fontSize}px` }"
  >
    <!-- Status Icon -->
    <div class="flex-shrink-0">
      <component 
        :is="statusIcon"
        class="w-6 h-6"
        :class="[
          statusColor,
          { 'animate-spin': status.syncing }
        ]"
      />
    </div>
    
    <!-- Status Info -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center justify-between">
        <h3 class="font-medium">Calendar Sync</h3>
        <button
          v-if="canSync"
          @click="$emit('sync')"
          class="px-3 py-1 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          :disabled="status.syncing"
        >
          Sync Now
        </button>
      </div>
      
      <div class="mt-1 text-sm text-muted-foreground">
        <p v-if="status.error" class="text-red-500">
          {{ status.error }}
        </p>
        <p v-else-if="status.syncing">
          Syncing calendar...
        </p>
        <p v-else>
          {{ lastSyncText }}
          <span v-if="status.eventsCount > 0">
            • {{ status.eventsCount }} events synced
          </span>
        </p>
        <p v-if="nextSyncTime && !status.syncing" class="text-xs mt-0.5">
          {{ nextSyncText }}
        </p>
      </div>
    </div>
  </div>
</template>