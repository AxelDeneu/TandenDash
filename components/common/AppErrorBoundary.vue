<template>
  <div class="app-error-boundary">
    <div v-if="!hasError" class="normal-content">
      <slot />
    </div>
    
    <div v-else class="error-fallback">
      <div class="error-container">
        <div class="error-icon">
          <AlertTriangle class="w-12 h-12 text-red-500" />
        </div>
        
        <div class="error-content">
          <h2 class="error-title">Something went wrong</h2>
          <p class="error-message">{{ errorMessage }}</p>
          
          <div class="error-actions">
            <Button @click="retry" :disabled="isRetrying">
              <RefreshCw class="w-4 h-4 mr-2" :class="{ 'animate-spin': isRetrying }" />
              Try Again
            </Button>
            
            <Button variant="outline" @click="reloadPage">
              Reload Page
            </Button>
            
            <Button 
              variant="ghost" 
              @click="showDetails = !showDetails"
              v-if="isDevelopment"
            >
              <ChevronDown class="w-4 h-4 mr-2" :class="{ 'rotate-180': showDetails }" />
              Show Details
            </Button>
          </div>
          
          <div v-if="showDetails && isDevelopment" class="error-details">
            <h3>Error Details</h3>
            <pre class="error-stack">{{ errorDetails }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onErrorCaptured } from 'vue'
import { AlertTriangle, RefreshCw, ChevronDown } from '@/lib/icons'
import { Button } from '@/components/ui/button'

interface Props {
  fallbackMessage?: string
  enableRetry?: boolean
  maxRetries?: number
}

const props = withDefaults(defineProps<Props>(), {
  fallbackMessage: 'An unexpected error occurred. Please try again.',
  enableRetry: true,
  maxRetries: 3
})

const emit = defineEmits<{
  (e: 'error', error: Error): void
  (e: 'retry'): void
}>()

// Error state
const hasError = ref(false)
const currentError = ref<Error | null>(null)
const retryCount = ref(0)
const isRetrying = ref(false)
const showDetails = ref(false)

// Environment detection
const isDevelopment = computed(() => {
  return process.env.NODE_ENV === 'development'
})

// Computed properties
const errorMessage = computed(() => {
  if (!currentError.value) return props.fallbackMessage
  if (isDevelopment.value) {
    return currentError.value.message || props.fallbackMessage
  }
  return props.fallbackMessage
})

const errorDetails = computed(() => {
  if (!currentError.value || !isDevelopment.value) return ''
  return currentError.value.stack || currentError.value.toString()
})

const canRetry = computed(() => {
  return props.enableRetry && retryCount.value < props.maxRetries
})

// Error handling
onErrorCaptured((error: Error) => {
  handleError(error)
  return false // Prevent error from propagating further
})

function handleError(error: Error): void {
  console.error('App Error Boundary caught error:', error)
  
  hasError.value = true
  currentError.value = error
  
  emit('error', error)
  
  // Report error to monitoring service if available
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'exception', {
      description: error.message,
      fatal: false
    })
  }
}

async function retry(): Promise<void> {
  if (!canRetry.value || isRetrying.value) return
  
  isRetrying.value = true
  retryCount.value++
  
  try {
    // Reset error state
    hasError.value = false
    currentError.value = null
    showDetails.value = false
    
    emit('retry')
    
    // Wait a moment for the component to re-render
    await new Promise(resolve => setTimeout(resolve, 100))
    
  } catch (error) {
    console.error('Retry failed:', error)
    handleError(error as Error)
  } finally {
    isRetrying.value = false
  }
}

function reloadPage(): void {
  window.location.reload()
}
</script>

<style scoped>
.app-error-boundary {
  @apply w-full h-full;
}

.normal-content {
  @apply w-full h-full;
}

.error-fallback {
  @apply w-full h-full flex items-center justify-center p-8;
  min-height: 400px;
}

.error-container {
  @apply flex flex-col items-center text-center space-y-6 max-w-lg;
}

.error-icon {
  @apply flex-shrink-0;
}

.error-content {
  @apply space-y-4;
}

.error-title {
  @apply text-2xl font-bold text-red-600 dark:text-red-400;
}

.error-message {
  @apply text-muted-foreground leading-relaxed;
}

.error-actions {
  @apply flex flex-wrap gap-3 justify-center;
}

.error-details {
  @apply mt-6 space-y-3 text-left;
}

.error-details h3 {
  @apply text-sm font-semibold text-foreground;
}

.error-stack {
  @apply text-xs bg-muted p-4 rounded border max-h-48 overflow-auto font-mono whitespace-pre-wrap;
}
</style>