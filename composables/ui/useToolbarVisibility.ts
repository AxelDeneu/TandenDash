import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useLogger } from '../core/useLogger'
import { useLocalStorage } from '@vueuse/core'

export interface UseToolbarVisibility {
  isVisible: Ref<boolean>
  isAutoHideEnabled: Ref<boolean>
  showToolbar: () => void
  hideToolbar: () => void
  toggleAutoHide: () => void
  forceShow: () => void
}

export function useToolbarVisibility(): UseToolbarVisibility {
  const logger = useLogger({ module: 'ToolbarVisibility' })
  
  // Persistent state for auto-hide preference
  const isAutoHideEnabled = useLocalStorage('toolbar-auto-hide', true)
  
  // Toolbar visibility state
  const isVisible = ref(!isAutoHideEnabled.value)
  const hideTimeoutId = ref<NodeJS.Timeout | null>(null)
  const lastInteractionTime = ref(Date.now())
  
  // Constants
  const AUTO_HIDE_DELAY = 30000 // 30 seconds
  const FOUR_FINGER_HOLD_DURATION = 2000 // 2 seconds
  
  // Touch tracking for 4-finger gesture
  const touchStartTime = ref(0)
  const touchCount = ref(0)
  const fourFingerTimeoutId = ref<NodeJS.Timeout | null>(null)
  
  // Show toolbar and reset auto-hide timer
  function showToolbar() {
    if (!isAutoHideEnabled.value) return
    
    isVisible.value = true
    lastInteractionTime.value = Date.now()
    resetAutoHideTimer()
    logger.debug('Toolbar shown')
  }
  
  // Hide toolbar
  function hideToolbar() {
    if (!isAutoHideEnabled.value) return
    
    isVisible.value = false
    logger.debug('Toolbar hidden')
  }
  
  // Toggle auto-hide feature
  function toggleAutoHide() {
    isAutoHideEnabled.value = !isAutoHideEnabled.value
    
    if (isAutoHideEnabled.value) {
      // Start auto-hide timer
      resetAutoHideTimer()
    } else {
      // Show toolbar and stop timer
      isVisible.value = true
      clearAutoHideTimer()
    }
    
    logger.info('Auto-hide toggled', { enabled: isAutoHideEnabled.value })
  }
  
  // Force show toolbar (used when entering edit mode, etc.)
  function forceShow() {
    isVisible.value = true
    clearAutoHideTimer()
  }
  
  // Reset auto-hide timer
  function resetAutoHideTimer() {
    clearAutoHideTimer()
    
    if (isAutoHideEnabled.value) {
      hideTimeoutId.value = setTimeout(() => {
        const timeSinceInteraction = Date.now() - lastInteractionTime.value
        if (timeSinceInteraction >= AUTO_HIDE_DELAY) {
          hideToolbar()
        } else {
          // Reset timer for remaining time
          resetAutoHideTimer()
        }
      }, AUTO_HIDE_DELAY)
    }
  }
  
  // Clear auto-hide timer
  function clearAutoHideTimer() {
    if (hideTimeoutId.value) {
      clearTimeout(hideTimeoutId.value)
      hideTimeoutId.value = null
    }
  }
  
  // Handle middle click
  function handleMouseDown(event: MouseEvent) {
    if (event.button === 1) { // Middle mouse button
      event.preventDefault()
      showToolbar()
      logger.debug('Middle click detected')
    }
  }
  
  // Handle touch events for 4-finger gesture
  function handleTouchStart(event: TouchEvent) {
    touchCount.value = event.touches.length
    
    if (touchCount.value === 4) {
      touchStartTime.value = Date.now()
      
      // Clear any existing timeout
      if (fourFingerTimeoutId.value) {
        clearTimeout(fourFingerTimeoutId.value)
      }
      
      // Set timeout for 2-second hold
      fourFingerTimeoutId.value = setTimeout(() => {
        if (touchCount.value === 4) {
          showToolbar()
          logger.debug('4-finger gesture detected')
        }
      }, FOUR_FINGER_HOLD_DURATION)
    }
  }
  
  function handleTouchEnd(event: TouchEvent) {
    touchCount.value = event.touches.length
    
    // Clear timeout if fingers lifted
    if (touchCount.value < 4 && fourFingerTimeoutId.value) {
      clearTimeout(fourFingerTimeoutId.value)
      fourFingerTimeoutId.value = null
    }
  }
  
  function handleTouchCancel() {
    touchCount.value = 0
    if (fourFingerTimeoutId.value) {
      clearTimeout(fourFingerTimeoutId.value)
      fourFingerTimeoutId.value = null
    }
  }
  
  // Setup event listeners
  onMounted(() => {
    if (typeof window === 'undefined') return
    
    // Mouse events
    window.addEventListener('mousedown', handleMouseDown)
    
    // Touch events
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })
    window.addEventListener('touchcancel', handleTouchCancel, { passive: true })
    
    // Start auto-hide timer if enabled
    if (isAutoHideEnabled.value) {
      resetAutoHideTimer()
    }
  })
  
  // Cleanup
  onUnmounted(() => {
    if (typeof window === 'undefined') return
    
    clearAutoHideTimer()
    
    if (fourFingerTimeoutId.value) {
      clearTimeout(fourFingerTimeoutId.value)
    }
    
    window.removeEventListener('mousedown', handleMouseDown)
    window.removeEventListener('touchstart', handleTouchStart)
    window.removeEventListener('touchend', handleTouchEnd)
    window.removeEventListener('touchcancel', handleTouchCancel)
  })
  
  return {
    isVisible: computed(() => isVisible.value),
    isAutoHideEnabled: computed(() => isAutoHideEnabled.value),
    showToolbar,
    hideToolbar,
    toggleAutoHide,
    forceShow
  }
}