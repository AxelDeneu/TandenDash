<template>
  <div class="widget-error-boundary">
    <slot v-if="!hasError" />
    <div v-else class="widget-error-fallback p-4 bg-destructive/10 rounded-lg border border-destructive/20">
      <h4 class="font-semibold text-destructive mb-2">Widget Error</h4>
      <p class="text-sm text-muted-foreground mb-3">{{ errorMessage }}</p>
      <Button
        v-if="canRetry"
        size="sm"
        variant="outline"
        @click="retry"
        :disabled="retryCount >= maxRetries"
      >
        {{ retryCount >= maxRetries ? 'Max retries reached' : `Retry (${retryCount}/${maxRetries})` }}
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onErrorCaptured, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { useWidgetSystem } from '@/composables/useWidgetSystem'

interface Props {
  widgetId: string
  instanceId?: string
  maxRetries?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxRetries: 3
})

const emit = defineEmits<{
  error: [error: Error]
  retry: []
}>()

const widgetSystem = useWidgetSystem()
const hasError = ref(false)
const errorMessage = ref('')
const retryCount = ref(0)
const canRetry = ref(true)

// Capture errors from child components
onErrorCaptured((error: Error) => {
  hasError.value = true
  errorMessage.value = error.message || 'An unexpected error occurred'
  
  // Register error with widget system if instance ID is provided
  if (props.instanceId) {
    widgetSystem.errorBoundary.registerError(props.instanceId, error, {
      widgetId: props.widgetId,
      timestamp: Date.now()
    })
  }
  
  emit('error', error)
  
  // Prevent error propagation
  return false
})

// Retry functionality
const retry = async () => {
  retryCount.value++
  hasError.value = false
  errorMessage.value = ''
  
  // Emit retry event
  emit('retry')
  
  // If using widget system, attempt recovery
  if (props.instanceId) {
    try {
      await widgetSystem.errorBoundary.recoverInstance(props.instanceId)
    } catch (error) {
      // Recovery failed
      hasError.value = true
      errorMessage.value = 'Failed to recover widget'
    }
  }
}

// Reset on widget change
watch(() => props.widgetId, () => {
  hasError.value = false
  errorMessage.value = ''
  retryCount.value = 0
})
</script>

<style scoped>
.widget-error-boundary {
  width: 100%;
  height: 100%;
}

.widget-error-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}
</style>