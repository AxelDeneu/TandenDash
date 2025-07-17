<template>
  <AppErrorBoundary>
    <div class="min-h-screen bg-background">
      <NuxtPage />
    </div>
  </AppErrorBoundary>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { provideComposableContext, initializeComposableContext, useDarkMode } from '@/composables'
import AppErrorBoundary from '@/components/common/AppErrorBoundary.vue'

// Provide composable context immediately during setup
provideComposableContext()

const darkMode = useDarkMode()

onMounted(async () => {
  // Initialize the composable system
  await initializeComposableContext()
  
  // Initialize dark mode
  await darkMode.initializeMode()
});
</script>
