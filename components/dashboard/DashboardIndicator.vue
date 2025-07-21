<script setup lang="ts">
import { computed } from 'vue'
import { useDashboard } from '@/composables'
import { Badge } from '@/components/ui/badge'

const dashboard = useDashboard()

const dashboardName = computed(() => 
  dashboard.currentDashboard.value?.name || 'Dashboard'
)

const isLoading = computed(() => dashboard.isLoading.value)
</script>

<template>
  <div class="dashboard-indicator">
    <Badge 
      variant="secondary" 
      class="px-3 py-1 font-medium"
      :class="{ 'opacity-50': isLoading }"
    >
      <span v-if="isLoading" class="mr-2">
        <svg class="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </span>
      {{ dashboardName }}
    </Badge>
  </div>
</template>

<style scoped>
.dashboard-indicator {
  display: inline-flex;
  align-items: center;
}
</style>