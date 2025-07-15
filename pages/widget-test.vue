<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-4">Widget System Test</h1>
    
    <div v-if="loading" class="text-gray-500">Loading widget system...</div>
    
    <div v-else-if="error" class="text-red-500">
      Error: {{ error.message }}
    </div>
    
    <div v-else>
      <div class="mb-4">
        <h2 class="text-xl font-semibold mb-2">System Info</h2>
        <pre class="bg-gray-100 p-4 rounded">{{ systemInfo }}</pre>
      </div>
      
      <div class="mb-4">
        <h2 class="text-xl font-semibold mb-2">Available Widgets ({{ widgets.length }})</h2>
        <div v-if="widgets.length === 0" class="text-yellow-600">
          No widgets found! Check console for errors.
        </div>
        <ul v-else class="list-disc list-inside">
          <li v-for="widget in widgets" :key="widget.name" class="mb-2">
            <strong>{{ widget.name }}</strong>
            <ul class="ml-4 text-sm text-gray-600">
              <li>Component: {{ widget.component ? '✓' : '✗' }}</li>
              <li>DefaultConfig: {{ widget.defaultConfig ? '✓' : '✗' }}</li>
              <li>ConfigSchema: {{ widget.configSchema ? '✓' : '✗' }}</li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useWidgetSystem } from '@/composables/useWidgetSystem'

const widgetSystem = useWidgetSystem()
const loading = ref(true)
const error = ref<Error | null>(null)
const widgets = ref<any[]>([])
const systemInfo = ref<any>({})

onMounted(async () => {
  try {
    // Ensure widget system is initialized
    await widgetSystem.ensureInitialized()
    
    // Get system info
    systemInfo.value = widgetSystem.systemInfo.value
    
    // Get all widgets
    widgets.value = widgetSystem.getAllWidgets()
    
    console.log('[Widget Test] System info:', systemInfo.value)
    console.log('[Widget Test] Available widgets:', widgets.value)
    
    loading.value = false
  } catch (err) {
    error.value = err as Error
    console.error('[Widget Test] Error:', err)
    loading.value = false
  }
})
</script>