import { ref, computed, readonly } from 'vue'
import type { ErrorHandler } from './interfaces'
import { useLogger } from './useLogger'

export function useErrorHandler(retryFn?: () => Promise<void>): ErrorHandler {
  const logger = useLogger({ module: 'ErrorHandler' })
  const error = ref<Error | null>(null)
  const retryCount = ref(0)
  const maxRetries = ref(3)
  const isRetrying = ref(false)

  function handleError(err: Error): void {
    logger.error('Composable error occurred', err, { 
      errorType: err.constructor.name,
      retryCount: retryCount.value 
    })
    error.value = err
    
    // Emit error event for global error handling
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('composable-error', {
        detail: { error: err, retryCount: retryCount.value }
      }))
    }
  }

  function clearError(): void {
    error.value = null
    retryCount.value = 0
  }

  async function retry(): Promise<void> {
    if (!retryFn || isRetrying.value || retryCount.value >= maxRetries.value) {
      if (retryCount.value >= maxRetries.value) {
        logger.warn('Max retries reached', { retryCount: retryCount.value, maxRetries: maxRetries.value })
      }
      return
    }

    isRetrying.value = true
    retryCount.value++
    logger.info('Retrying operation', { attempt: retryCount.value, maxRetries: maxRetries.value })

    try {
      await retryFn()
      logger.info('Retry successful', { attempt: retryCount.value })
      clearError()
    } catch (err) {
      logger.error('Retry failed', err, { attempt: retryCount.value })
      handleError(err as Error)
    } finally {
      isRetrying.value = false
    }
  }

  const canRetry = computed(() => {
    return retryFn && !isRetrying.value && retryCount.value < maxRetries.value
  })

  const hasError = computed(() => error.value !== null)

  return {
    error: readonly(error),
    retryCount: readonly(retryCount),
    isRetrying: readonly(isRetrying),
    maxRetries,
    canRetry,
    hasError,
    handleError,
    clearError,
    retry
  } as ErrorHandler & {
    error: typeof error
    retryCount: typeof retryCount
    isRetrying: typeof isRetrying
    maxRetries: typeof maxRetries
    canRetry: typeof canRetry
    hasError: typeof hasError
  }
}