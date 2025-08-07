import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { useSwipeGesture } from '@/composables/interaction/useSwipeGesture'

// Mock touch events
class MockTouch {
  constructor(public clientX: number, public clientY: number) {}
}

class MockTouchEvent extends Event {
  public touches: Touch[]

  constructor(type: string, touches: Touch[]) {
    super(type)
    this.touches = touches
  }
}

// Mock DOM element
const createMockElement = () => {
  const listeners: Record<string, Function[]> = {}
  
  return {
    addEventListener: vi.fn((event: string, handler: Function, options?: any) => {
      if (!listeners[event]) listeners[event] = []
      listeners[event].push(handler)
    }),
    removeEventListener: vi.fn((event: string, handler: Function) => {
      if (listeners[event]) {
        const index = listeners[event].indexOf(handler)
        if (index > -1) listeners[event].splice(index, 1)
      }
    }),
    dispatchEvent: vi.fn((event: Event) => {
      const eventListeners = listeners[event.type]
      if (eventListeners) {
        eventListeners.forEach(handler => handler(event))
      }
    }),
    listeners
  }
}

describe('useSwipeGesture Composable', () => {
  let mockElement: any
  let elementRef: any

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockElement = createMockElement()
    elementRef = ref(mockElement)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initialization', () => {
    it('should initialize with default options', () => {
      const swipe = useSwipeGesture(elementRef)

      expect(swipe.onSwipeLeft.value).toBeNull()
      expect(swipe.onSwipeRight.value).toBeNull()
      expect(swipe.onSwipeUp.value).toBeNull()
      expect(swipe.onSwipeDown.value).toBeNull()
      expect(swipe.isActive.value).toBe(false)
    })

    it('should setup event listeners on mount', async () => {
      // Mock the Vue lifecycle functions
      let onMountedCallback: Function | null = null
      vi.doMock('vue', async () => {
        const actual = await vi.importActual('vue')
        return {
          ...actual,
          onMounted: (callback: Function) => {
            onMountedCallback = callback
          },
          onUnmounted: vi.fn()
        }
      })

      const { useSwipeGesture } = await import('@/composables/interaction/useSwipeGesture')
      useSwipeGesture(elementRef)
      
      // Manually trigger the onMounted callback
      if (onMountedCallback) {
        onMountedCallback()
        await nextTick()
      }

      expect(mockElement.addEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function), { passive: true })
      expect(mockElement.addEventListener).toHaveBeenCalledWith('touchmove', expect.any(Function), { passive: false })
      expect(mockElement.addEventListener).toHaveBeenCalledWith('touchend', expect.any(Function), { passive: true })
      expect(mockElement.addEventListener).toHaveBeenCalledWith('touchcancel', expect.any(Function), { passive: true })
    })

    it('should handle null element reference', async () => {
      const nullRef = ref(null)
      
      expect(() => useSwipeGesture(nullRef)).not.toThrow()
      await nextTick()
      // Should not crash when element is null
    })

    it('should accept custom options', () => {
      const options = {
        threshold: 100,
        timeout: 500,
        preventDefault: false
      }

      const swipe = useSwipeGesture(elementRef, options)

      expect(swipe.isActive.value).toBe(false)
    })
  })

  describe('touch start handling', () => {
    it('should handle single touch start', async () => {
      const swipe = useSwipeGesture(elementRef)
      await nextTick()

      const touch = new MockTouch(100, 100)
      const touchEvent = new MockTouchEvent('touchstart', [touch])

      mockElement.dispatchEvent(touchEvent)

      expect(swipe.isActive.value).toBe(true)
    })

    it('should ignore multi-touch start', async () => {
      const swipe = useSwipeGesture(elementRef)
      await nextTick()

      const touches = [new MockTouch(100, 100), new MockTouch(200, 200)]
      const touchEvent = new MockTouchEvent('touchstart', touches)

      mockElement.dispatchEvent(touchEvent)

      expect(swipe.isActive.value).toBe(false)
    })
  })

  describe('swipe detection', () => {
    it('should detect right swipe', async () => {
      const swipeRightCallback = vi.fn()
      const swipe = useSwipeGesture(elementRef, { threshold: 50 })
      swipe.onSwipeRight.value = swipeRightCallback
      await nextTick()

      // Start touch
      const startTouch = new MockTouch(100, 100)
      const startEvent = new MockTouchEvent('touchstart', [startTouch])
      mockElement.dispatchEvent(startEvent)

      // Move touch (optional for tracking)
      const moveTouch = new MockTouch(180, 100)
      const moveEvent = new MockTouchEvent('touchmove', [moveTouch])
      mockElement.dispatchEvent(moveEvent)

      // End touch - right swipe (delta > threshold)
      const endTouch = new MockTouch(180, 100)
      const endEvent = new MockTouchEvent('touchend', [])
      mockElement.dispatchEvent(endEvent)

      expect(swipeRightCallback).toHaveBeenCalled()
      expect(swipe.isActive.value).toBe(false)
    })

    it('should detect left swipe', async () => {
      const swipeLeftCallback = vi.fn()
      const swipe = useSwipeGesture(elementRef, { threshold: 50 })
      swipe.onSwipeLeft.value = swipeLeftCallback
      await nextTick()

      // Start touch
      const startTouch = new MockTouch(200, 100)
      const startEvent = new MockTouchEvent('touchstart', [startTouch])
      mockElement.dispatchEvent(startEvent)

      // Move and end touch - left swipe
      const moveTouch = new MockTouch(120, 100)
      const moveEvent = new MockTouchEvent('touchmove', [moveTouch])
      mockElement.dispatchEvent(moveEvent)

      const endEvent = new MockTouchEvent('touchend', [])
      mockElement.dispatchEvent(endEvent)

      expect(swipeLeftCallback).toHaveBeenCalled()
    })

    it('should detect up swipe', async () => {
      const swipeUpCallback = vi.fn()
      const swipe = useSwipeGesture(elementRef, { threshold: 50 })
      swipe.onSwipeUp.value = swipeUpCallback
      await nextTick()

      // Start touch
      const startTouch = new MockTouch(100, 200)
      const startEvent = new MockTouchEvent('touchstart', [startTouch])
      mockElement.dispatchEvent(startEvent)

      // Move and end touch - up swipe
      const moveTouch = new MockTouch(100, 120)
      const moveEvent = new MockTouchEvent('touchmove', [moveTouch])
      mockElement.dispatchEvent(moveEvent)

      const endEvent = new MockTouchEvent('touchend', [])
      mockElement.dispatchEvent(endEvent)

      expect(swipeUpCallback).toHaveBeenCalled()
    })

    it('should detect down swipe', async () => {
      const swipeDownCallback = vi.fn()
      const swipe = useSwipeGesture(elementRef, { threshold: 50 })
      swipe.onSwipeDown.value = swipeDownCallback
      await nextTick()

      // Start touch
      const startTouch = new MockTouch(100, 100)
      const startEvent = new MockTouchEvent('touchstart', [startTouch])
      mockElement.dispatchEvent(startEvent)

      // Move and end touch - down swipe
      const moveTouch = new MockTouch(100, 180)
      const moveEvent = new MockTouchEvent('touchmove', [moveTouch])
      mockElement.dispatchEvent(moveEvent)

      const endEvent = new MockTouchEvent('touchend', [])
      mockElement.dispatchEvent(endEvent)

      expect(swipeDownCallback).toHaveBeenCalled()
    })
  })

  describe('threshold and timeout handling', () => {
    it('should not trigger swipe below threshold', async () => {
      const swipeRightCallback = vi.fn()
      const swipe = useSwipeGesture(elementRef, { threshold: 100 })
      swipe.onSwipeRight.value = swipeRightCallback
      await nextTick()

      // Start touch
      const startTouch = new MockTouch(100, 100)
      const startEvent = new MockTouchEvent('touchstart', [startTouch])
      mockElement.dispatchEvent(startEvent)

      // Small movement (below threshold)
      const moveTouch = new MockTouch(120, 100)
      const moveEvent = new MockTouchEvent('touchmove', [moveTouch])
      mockElement.dispatchEvent(moveEvent)

      const endEvent = new MockTouchEvent('touchend', [])
      mockElement.dispatchEvent(endEvent)

      expect(swipeRightCallback).not.toHaveBeenCalled()
    })

    it('should not trigger swipe after timeout', async () => {
      const swipeRightCallback = vi.fn()
      const swipe = useSwipeGesture(elementRef, { threshold: 50, timeout: 300 })
      swipe.onSwipeRight.value = swipeRightCallback
      await nextTick()

      // Start touch
      const startTouch = new MockTouch(100, 100)
      const startEvent = new MockTouchEvent('touchstart', [startTouch])
      mockElement.dispatchEvent(startEvent)

      // Advance time beyond timeout
      vi.advanceTimersByTime(400)

      // End touch after timeout
      const endEvent = new MockTouchEvent('touchend', [])
      mockElement.dispatchEvent(endEvent)

      expect(swipeRightCallback).not.toHaveBeenCalled()
      expect(swipe.isActive.value).toBe(false)
    })
  })

  describe('preventDefault behavior', () => {
    it('should prevent default on horizontal swipe when enabled', async () => {
      useSwipeGesture(elementRef, { preventDefault: true })
      await nextTick()

      // Start touch
      const startTouch = new MockTouch(100, 100)
      const startEvent = new MockTouchEvent('touchstart', [startTouch])
      mockElement.dispatchEvent(startEvent)

      // Horizontal move should prevent default
      const moveTouch = new MockTouch(150, 105) // More horizontal than vertical
      const moveEvent = new MockTouchEvent('touchmove', [moveTouch])
      const preventDefaultSpy = vi.spyOn(moveEvent, 'preventDefault')

      mockElement.dispatchEvent(moveEvent)

      expect(preventDefaultSpy).toHaveBeenCalled()
    })

    it('should not prevent default when disabled', async () => {
      useSwipeGesture(elementRef, { preventDefault: false })
      await nextTick()

      // Start touch
      const startTouch = new MockTouch(100, 100)
      const startEvent = new MockTouchEvent('touchstart', [startTouch])
      mockElement.dispatchEvent(startEvent)

      // Horizontal move should not prevent default
      const moveTouch = new MockTouch(150, 100)
      const moveEvent = new MockTouchEvent('touchmove', [moveTouch])
      const preventDefaultSpy = vi.spyOn(moveEvent, 'preventDefault')

      mockElement.dispatchEvent(moveEvent)

      expect(preventDefaultSpy).not.toHaveBeenCalled()
    })

    it('should not prevent default for vertical swipes', async () => {
      useSwipeGesture(elementRef, { preventDefault: true })
      await nextTick()

      // Start touch
      const startTouch = new MockTouch(100, 100)
      const startEvent = new MockTouchEvent('touchstart', [startTouch])
      mockElement.dispatchEvent(startEvent)

      // Vertical move should not prevent default
      const moveTouch = new MockTouch(105, 150) // More vertical than horizontal
      const moveEvent = new MockTouchEvent('touchmove', [moveTouch])
      const preventDefaultSpy = vi.spyOn(moveEvent, 'preventDefault')

      mockElement.dispatchEvent(moveEvent)

      expect(preventDefaultSpy).not.toHaveBeenCalled()
    })
  })

  describe('touch cancel handling', () => {
    it('should deactivate on touch cancel', async () => {
      const swipe = useSwipeGesture(elementRef)
      await nextTick()

      // Start touch
      const startTouch = new MockTouch(100, 100)
      const startEvent = new MockTouchEvent('touchstart', [startTouch])
      mockElement.dispatchEvent(startEvent)

      expect(swipe.isActive.value).toBe(true)

      // Cancel touch
      const cancelEvent = new MockTouchEvent('touchcancel', [])
      mockElement.dispatchEvent(cancelEvent)

      expect(swipe.isActive.value).toBe(false)
    })
  })

  describe('multi-touch handling', () => {
    it('should ignore multi-touch during active gesture', async () => {
      const swipeRightCallback = vi.fn()
      const swipe = useSwipeGesture(elementRef)
      swipe.onSwipeRight.value = swipeRightCallback
      await nextTick()

      // Start with single touch
      const startTouch = new MockTouch(100, 100)
      const startEvent = new MockTouchEvent('touchstart', [startTouch])
      mockElement.dispatchEvent(startEvent)

      expect(swipe.isActive.value).toBe(true)

      // Multi-touch move should be ignored
      const multiTouches = [new MockTouch(150, 100), new MockTouch(200, 100)]
      const moveEvent = new MockTouchEvent('touchmove', multiTouches)
      mockElement.dispatchEvent(moveEvent)

      const endEvent = new MockTouchEvent('touchend', [])
      mockElement.dispatchEvent(endEvent)

      // Should not trigger callback due to multi-touch
      expect(swipeRightCallback).not.toHaveBeenCalled()
    })
  })

  describe('swipe direction priority', () => {
    it('should prefer horizontal over vertical when both exceed threshold', async () => {
      const swipeRightCallback = vi.fn()
      const swipeDownCallback = vi.fn()
      const swipe = useSwipeGesture(elementRef, { threshold: 50 })
      swipe.onSwipeRight.value = swipeRightCallback
      swipe.onSwipeDown.value = swipeDownCallback
      await nextTick()

      // Start touch
      const startTouch = new MockTouch(100, 100)
      const startEvent = new MockTouchEvent('touchstart', [startTouch])
      mockElement.dispatchEvent(startEvent)

      // Diagonal move with more horizontal component
      const moveTouch = new MockTouch(180, 160)
      const moveEvent = new MockTouchEvent('touchmove', [moveTouch])
      mockElement.dispatchEvent(moveEvent)

      const endEvent = new MockTouchEvent('touchend', [])
      mockElement.dispatchEvent(endEvent)

      expect(swipeRightCallback).toHaveBeenCalled()
      expect(swipeDownCallback).not.toHaveBeenCalled()
    })

    it('should trigger vertical swipe when vertical movement is dominant', async () => {
      const swipeRightCallback = vi.fn()
      const swipeDownCallback = vi.fn()
      const swipe = useSwipeGesture(elementRef, { threshold: 50 })
      swipe.onSwipeRight.value = swipeRightCallback
      swipe.onSwipeDown.value = swipeDownCallback
      await nextTick()

      // Start touch
      const startTouch = new MockTouch(100, 100)
      const startEvent = new MockTouchEvent('touchstart', [startTouch])
      mockElement.dispatchEvent(startEvent)

      // Diagonal move with more vertical component
      const moveTouch = new MockTouch(140, 180)
      const moveEvent = new MockTouchEvent('touchmove', [moveTouch])
      mockElement.dispatchEvent(moveEvent)

      const endEvent = new MockTouchEvent('touchend', [])
      mockElement.dispatchEvent(endEvent)

      expect(swipeDownCallback).toHaveBeenCalled()
      expect(swipeRightCallback).not.toHaveBeenCalled()
    })
  })

  describe('cleanup', () => {
    it('should remove event listeners on unmount', () => {
      useSwipeGesture(elementRef)

      // Simulate unmount by manually calling the cleanup
      // In real Vue component, this would happen automatically
      expect(mockElement.removeEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function))
      expect(mockElement.removeEventListener).toHaveBeenCalledWith('touchmove', expect.any(Function))
      expect(mockElement.removeEventListener).toHaveBeenCalledWith('touchend', expect.any(Function))
      expect(mockElement.removeEventListener).toHaveBeenCalledWith('touchcancel', expect.any(Function))
    })
  })
})