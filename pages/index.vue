<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from '#app'
import { useDashboard } from '@/composables'
import LoadingPlaceholder from '@/components/common/LoadingPlaceholder.vue'

const router = useRouter()
const dashboard = useDashboard()

onMounted(async () => {
  try {
    // Fetch the default dashboard
    await dashboard.fetchDefaultDashboard()
    
    // Redirect to the default dashboard
    if (dashboard.currentDashboard.value?.id) {
      await router.replace(`/dashboard/${dashboard.currentDashboard.value.id}`)
    } else {
      // If no default dashboard exists, show error
      console.error('No default dashboard found')
    }
  } catch (error) {
    console.error('Failed to load default dashboard:', error)
  }
})
</script>

<template>
  <div class="h-screen w-screen flex items-center justify-center">
    <LoadingPlaceholder 
      type="page" 
      :message="$t('common.redirecting')"
      :show-skeleton="true"
    />
  </div>
</template>