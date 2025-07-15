<template>
  <div class="widget-error-boundary">
    <!-- Normal widget content -->
    <div v-if="!hasError" class="widget-content">
      <slot />
    </div>
    
    <!-- Error fallback UI -->
    <div v-else class="error-fallback">
      <div class="error-container">
        <div class="error-icon">
          <AlertTriangle class="w-8 h-8 text-red-500" />
        </div>
        
        <div class="error-content">
          <h3 class="error-title">Widget Error</h3>
          <p class="error-message">{{ errorMessage }}</p>
          
          <div class="error-actions">
            <Button 
              size="sm" 
              variant="outline" 
              @click="retry"
              :disabled="isRetrying"
            >
              <RefreshCw class="w-4 h-4 mr-2" :class="{ 'animate-spin': isRetrying }" />
              Retry
            </Button>
            
            <Button 
              size="sm" 
              variant="ghost" 
              @click="showDetails = !showDetails"
            >
              <ChevronDown class="w-4 h-4 mr-2" :class="{ 'rotate-180': showDetails }" />
              Details
            </Button>
            
            <Button 
              size="sm" 
              variant="destructive" 
              @click="removeWidget"
            >
              <X class="w-4 h-4 mr-2" />
              Remove
            </Button>
          </div>
          
          <!-- Error details -->
          <div v-if="showDetails" class="error-details">
            <div class="details-section">
              <h4>Error Details</h4>
              <pre class="error-stack">{{ errorDetails }}</pre>
            </div>
            
            <div class="details-section">
              <h4>Widget Info</h4>
              <ul class="widget-info">
                <li><strong>Plugin ID:</strong> {{ widgetInfo.pluginId }}</li>
                <li><strong>Instance ID:</strong> {{ widgetInfo.instanceId }}</li>
                <li><strong>Error Time:</strong> {{ formatTime(errorTime) }}</li>
                <li><strong>Recovery Attempts:</strong> {{ recoveryAttempts }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onErrorCaptured, onMounted, onUnmounted } from 'vue'
import { AlertTriangle, RefreshCw, ChevronDown, X } from '@/lib/icons'
import { Button } from '@/components/ui/button'
import { widgetSystem } from '@/lib/widgets/WidgetSystem'

interface Props {
  instanceId: string
  pluginId: string
  maxRetries?: number
  autoRetry?: boolean
  autoRetryDelay?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxRetries: 3,
  autoRetry: true,
  autoRetryDelay: 2000
})

const emit = defineEmits<{
  (e: 'error', error: Error): void
  (e: 'retry'): void
  (e: 'remove'): void
  (e: 'recovered'): void
}>()

// Error state
const hasError = ref(false)
const currentError = ref<Error | null>(null)
const errorTime = ref<Date | null>(null)
const recoveryAttempts = ref(0)
const isRetrying = ref(false)
const showDetails = ref(false)
const autoRetryTimeout = ref<NodeJS.Timeout | null>(null)

// Computed properties
const errorMessage = computed(() => {
  if (!currentError.value) return 'Unknown error occurred'
  return currentError.value.message || 'An unexpected error occurred'
})

const errorDetails = computed(() => {
  if (!currentError.value) return ''
  return currentError.value.stack || currentError.value.toString()
})

const widgetInfo = computed(() => ({
  pluginId: props.pluginId,
  instanceId: props.instanceId
}))

const canRetry = computed(() => {
  return recoveryAttempts.value < props.maxRetries
})

// Error handling
onErrorCaptured((error: Error) => {
  handleError(error)
  return false // Prevent error from propagating
})

function handleError(error: Error): void {
  console.error(`Widget error in ${props.instanceId}:`, error)
  
  hasError.value = true
  currentError.value = error
  errorTime.value = new Date()
  
  // Report to widget system
  widgetSystem.errorBoundary.handleError(error, props.instanceId)
  
  emit('error', error)
  
  // Auto retry if enabled and under limit
  if (props.autoRetry && canRetry.value) {
    scheduleAutoRetry()
  }
}

function scheduleAutoRetry(): void {
  if (autoRetryTimeout.value) {
    clearTimeout(autoRetryTimeout.value)
  }
  
  autoRetryTimeout.value = setTimeout(() => {
    retry()
  }, props.autoRetryDelay)
}

async function retry(): Promise<void> {
  if (isRetrying.value || !canRetry.value) {
    return
  }
  
  isRetrying.value = true
  recoveryAttempts.value++
  
  try {
    // Clear auto retry timeout
    if (autoRetryTimeout.value) {
      clearTimeout(autoRetryTimeout.value)
      autoRetryTimeout.value = null
    }
    
    // Attempt recovery through widget system
    const success = await widgetSystem.errorBoundary.recoverInstance(props.instanceId)
    
    if (success) {
      // Reset error state
      hasError.value = false
      currentError.value = null
      errorTime.value = null
      showDetails.value = false
      
      emit('recovered')
      console.log(`Widget ${props.instanceId} recovered successfully`)
    } else {
      throw new Error('Recovery failed')
    }
    
  } catch (error) {
    console.error(`Recovery attempt failed for ${props.instanceId}:`, error)
    handleError(error as Error)
  } finally {
    isRetrying.value = false
    emit('retry')
  }
}

function removeWidget(): void {
  emit('remove')
}

function formatTime(date: Date | null): string {
  if (!date) return 'Unknown'
  return date.toLocaleTimeString()
}

// Cleanup
onUnmounted(() => {
  if (autoRetryTimeout.value) {
    clearTimeout(autoRetryTimeout.value)
  }
})

// Reset error state when instance changes
onMounted(() => {
  hasError.value = false
  currentError.value = null
  errorTime.value = null
  recoveryAttempts.value = 0
})
</script>

<style scoped>
.widget-error-boundary {
  @apply w-full h-full;
}

.widget-content {
  @apply w-full h-full;
}

.error-fallback {
  @apply w-full h-full flex items-center justify-center p-4;
  min-height: 150px;
}

.error-container {
  @apply flex flex-col items-center text-center space-y-4 max-w-md;
}

.error-icon {
  @apply flex-shrink-0;
}

.error-content {
  @apply space-y-3;
}

.error-title {
  @apply text-lg font-semibold text-red-600 dark:text-red-400;
}

.error-message {
  @apply text-sm text-muted-foreground;
}

.error-actions {
  @apply flex flex-wrap gap-2 justify-center;
}

.error-details {
  @apply mt-4 space-y-3 text-left;
}

.details-section {
  @apply space-y-2;
}

.details-section h4 {
  @apply text-sm font-medium text-foreground;
}

.error-stack {
  @apply text-xs bg-muted p-2 rounded border max-h-32 overflow-auto font-mono;
}

.widget-info {
  @apply text-xs space-y-1;
}

.widget-info li {
  @apply break-all;
}
</style>