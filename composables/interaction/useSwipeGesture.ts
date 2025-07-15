import { ref, onMounted, onUnmounted, nextTick, type Ref } from 'vue'

export interface SwipeOptions {
  threshold?: number
  timeout?: number
  preventDefault?: boolean
}

export function useSwipeGesture(element: Ref<HTMLElement | null>, options: SwipeOptions = {}) {
  const {
    threshold = 50,
    timeout = 300,
    preventDefault = true
  } = options

  const touchStartX = ref(0)
  const touchStartY = ref(0)
  const touchEndX = ref(0)
  const touchEndY = ref(0)
  const touchStartTime = ref(0)
  const isActive = ref(false)

  const onSwipeLeft = ref<(() => void) | null>(null)
  const onSwipeRight = ref<(() => void) | null>(null)
  const onSwipeUp = ref<(() => void) | null>(null)
  const onSwipeDown = ref<(() => void) | null>(null)

  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length !== 1) return
    
    isActive.value = true
    touchStartX.value = e.touches[0].clientX
    touchStartY.value = e.touches[0].clientY
    touchStartTime.value = Date.now()
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!isActive.value || e.touches.length !== 1) return
    
    if (preventDefault) {
      const deltaX = Math.abs(e.touches[0].clientX - touchStartX.value)
      const deltaY = Math.abs(e.touches[0].clientY - touchStartY.value)
      
      // Only prevent default if horizontal swipe is dominant
      if (deltaX > deltaY && deltaX > 10) {
        e.preventDefault()
      }
    }
    
    touchEndX.value = e.touches[0].clientX
    touchEndY.value = e.touches[0].clientY
  }

  const handleTouchEnd = (e: TouchEvent) => {
    if (!isActive.value) return
    
    const deltaTime = Date.now() - touchStartTime.value
    if (deltaTime > timeout) {
      isActive.value = false
      return
    }

    const deltaX = touchEndX.value - touchStartX.value
    const deltaY = touchEndY.value - touchStartY.value
    const absDeltaX = Math.abs(deltaX)
    const absDeltaY = Math.abs(deltaY)

    // Check if swipe meets threshold and is more horizontal than vertical
    if (absDeltaX > threshold && absDeltaX > absDeltaY) {
      if (deltaX > 0 && onSwipeRight.value) {
        onSwipeRight.value()
      } else if (deltaX < 0 && onSwipeLeft.value) {
        onSwipeLeft.value()
      }
    } else if (absDeltaY > threshold && absDeltaY > absDeltaX) {
      if (deltaY > 0 && onSwipeDown.value) {
        onSwipeDown.value()
      } else if (deltaY < 0 && onSwipeUp.value) {
        onSwipeUp.value()
      }
    }

    isActive.value = false
  }

  const handleTouchCancel = () => {
    isActive.value = false
  }

  const setupListeners = () => {
    if (!element.value || !(element.value instanceof HTMLElement)) return

    element.value.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.value.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.value.addEventListener('touchend', handleTouchEnd, { passive: true })
    element.value.addEventListener('touchcancel', handleTouchCancel, { passive: true })
  }

  const cleanupListeners = () => {
    if (!element.value || !(element.value instanceof HTMLElement)) return

    element.value.removeEventListener('touchstart', handleTouchStart)
    element.value.removeEventListener('touchmove', handleTouchMove)
    element.value.removeEventListener('touchend', handleTouchEnd)
    element.value.removeEventListener('touchcancel', handleTouchCancel)
  }

  onMounted(() => {
    // Wait for next tick to ensure element is properly mounted
    nextTick(() => {
      setupListeners()
    })
  })

  onUnmounted(() => {
    cleanupListeners()
  })

  return {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    isActive
  }
}