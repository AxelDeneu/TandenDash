import { ref, computed, onMounted, onUnmounted, readonly, type Ref } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { useLogger } from '../core/useLogger'

export interface DockPosition {
  x: number
  y: number
}

export interface UseFloatingDockOptions {
  defaultPosition?: DockPosition
  autoHideDelay?: number
  dragConstraints?: {
    minX?: number
    minY?: number
    maxX?: number
    maxY?: number
  }
}

export interface UseFloatingDock {
  // Position state
  position: Ref<DockPosition>
  dockPosition: Ref<string>
  
  // Visibility state
  isVisible: Ref<boolean>
  isAutoHideEnabled: Ref<boolean>
  
  // Drag state
  isDragging: Ref<boolean>
  
  // Methods
  show: () => void
  hide: () => void
  toggle: () => void
  toggleAutoHide: () => void
  centerDock: () => void
  updateInteractionTime: () => void
  
  // Drag methods
  startDrag: (event: MouseEvent | TouchEvent) => void
  
  // Gesture handlers
  handleWheelClick: (event: MouseEvent) => void
  handleFourFingerTouch: () => void
}

// Constants for dock dimensions
const DOCK_WIDTH = 120
const DOCK_HEIGHT = 60
const DOCK_MARGIN = 20

export function useFloatingDock(options: UseFloatingDockOptions = {}): UseFloatingDock {
  const logger = useLogger({ module: 'FloatingDock' })
  
  // Calculate centered default position
  const calculateDefaultPosition = (): DockPosition => {
    if (typeof window === 'undefined') {
      return { x: 100, y: 100 }
    }
    return {
      x: Math.floor((window.innerWidth - DOCK_WIDTH) / 2),
      y: window.innerHeight - DOCK_HEIGHT - DOCK_MARGIN
    }
  }
  
  const {
    defaultPosition = calculateDefaultPosition(),
    autoHideDelay = 30000,
    dragConstraints = {}
  } = options
  
  // Persistent position storage
  const position = useLocalStorage('floating-dock-position', defaultPosition)
  
  // Visibility state
  const isVisible = ref(false)
  const isAutoHideEnabled = useLocalStorage('floating-dock-auto-hide', true)
  
  // Drag state
  const isDragging = ref(false)
  const dragStartPosition = ref<DockPosition | null>(null)
  const dragOffset = ref<DockPosition>({ x: 0, y: 0 })
  
  // Auto-hide timer
  const autoHideTimeoutId = ref<NodeJS.Timeout | null>(null)
  const lastInteractionTime = ref(Date.now())
  
  // Touch gesture state for 4-finger detection
  const touchStartTime = ref(0)
  const touchCount = ref(0)
  const fourFingerTimeoutId = ref<NodeJS.Timeout | null>(null)
  const FOUR_FINGER_HOLD_DURATION = 2000
  
  // Computed dock position style
  const dockPosition = computed(() => {
    return `transform: translate(${position.value.x}px, ${position.value.y}px)`
  })
  
  // Show dock
  function show(): void {
    isVisible.value = true
    lastInteractionTime.value = Date.now()
    resetAutoHideTimer()
    logger.debug('Dock shown')
  }
  
  // Hide dock
  function hide(): void {
    isVisible.value = false
    clearAutoHideTimer()
    logger.debug('Dock hidden')
  }
  
  // Toggle dock visibility
  function toggle(): void {
    if (isVisible.value) {
      hide()
    } else {
      show()
    }
  }
  
  // Toggle auto-hide feature
  function toggleAutoHide(): void {
    isAutoHideEnabled.value = !isAutoHideEnabled.value
    
    if (isAutoHideEnabled.value) {
      resetAutoHideTimer()
    } else {
      clearAutoHideTimer()
      show()
    }
    
    logger.info('Auto-hide toggled', { enabled: isAutoHideEnabled.value })
  }
  
  // Center dock on screen
  function centerDock(): void {
    if (typeof window === 'undefined') return
    
    const centeredPosition = {
      x: Math.floor((window.innerWidth - DOCK_WIDTH) / 2),
      y: window.innerHeight - DOCK_HEIGHT - DOCK_MARGIN
    }
    
    position.value = applyConstraints(centeredPosition)
    logger.debug('Dock centered', { position: position.value })
  }
  
  // Update interaction time (resets auto-hide timer)
  function updateInteractionTime(): void {
    lastInteractionTime.value = Date.now()
    resetAutoHideTimer()
  }
  
  // Auto-hide timer management
  function resetAutoHideTimer(): void {
    clearAutoHideTimer()
    
    if (isAutoHideEnabled.value && isVisible.value) {
      autoHideTimeoutId.value = setTimeout(() => {
        const timeSinceInteraction = Date.now() - lastInteractionTime.value
        if (timeSinceInteraction >= autoHideDelay) {
          hide()
        } else {
          resetAutoHideTimer()
        }
      }, autoHideDelay)
    }
  }
  
  function clearAutoHideTimer(): void {
    if (autoHideTimeoutId.value) {
      clearTimeout(autoHideTimeoutId.value)
      autoHideTimeoutId.value = null
    }
  }
  
  // Apply constraints to position
  function applyConstraints(pos: DockPosition): DockPosition {
    if (typeof window === 'undefined') {
      return pos
    }
    
    const constraints = {
      minX: dragConstraints.minX ?? 10,
      minY: dragConstraints.minY ?? 10,
      maxX: dragConstraints.maxX ?? window.innerWidth - DOCK_WIDTH - 10,
      maxY: dragConstraints.maxY ?? window.innerHeight - DOCK_HEIGHT - 10
    }
    
    return {
      x: Math.max(constraints.minX, Math.min(constraints.maxX, pos.x)),
      y: Math.max(constraints.minY, Math.min(constraints.maxY, pos.y))
    }
  }
  
  // Start drag operation
  function startDrag(event: MouseEvent | TouchEvent): void {
    event.preventDefault()
    event.stopPropagation()
    
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY
    
    isDragging.value = true
    dragStartPosition.value = { ...position.value }
    dragOffset.value = {
      x: clientX - position.value.x,
      y: clientY - position.value.y
    }
    
    // Prevent auto-hide during drag
    clearAutoHideTimer()
    
    logger.debug('Drag started', { startPosition: dragStartPosition.value })
  }
  
  // Handle mouse wheel click (middle click)
  function handleWheelClick(event: MouseEvent): void {
    if (event.button === 1) { // Middle mouse button
      event.preventDefault()
      toggle()
      logger.debug('Wheel click detected')
    }
  }
  
  // Handle 4-finger touch gesture
  function handleFourFingerTouch(): void {
    toggle()
    logger.debug('4-finger gesture detected')
  }
  
  // Mouse/touch move handler
  function handlePointerMove(event: MouseEvent | TouchEvent): void {
    if (!isDragging.value || !dragStartPosition.value) return
    
    event.preventDefault()
    
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY
    
    const newPosition = applyConstraints({
      x: clientX - dragOffset.value.x,
      y: clientY - dragOffset.value.y
    })
    
    position.value = newPosition
  }
  
  // Mouse/touch end handler
  function handlePointerEnd(): void {
    if (!isDragging.value) return
    
    isDragging.value = false
    dragStartPosition.value = null
    dragOffset.value = { x: 0, y: 0 }
    
    // Resume auto-hide after drag
    updateInteractionTime()
    
    logger.debug('Drag ended', { finalPosition: position.value })
  }
  
  // Touch start handler for 4-finger detection
  function handleTouchStart(event: TouchEvent): void {
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
          handleFourFingerTouch()
        }
      }, FOUR_FINGER_HOLD_DURATION)
    } else {
      // Clear timeout if not 4 fingers
      if (fourFingerTimeoutId.value) {
        clearTimeout(fourFingerTimeoutId.value)
        fourFingerTimeoutId.value = null
      }
    }
  }
  
  function handleTouchEnd(event: TouchEvent): void {
    touchCount.value = event.touches.length
    
    // Clear timeout if fingers lifted
    if (touchCount.value < 4 && fourFingerTimeoutId.value) {
      clearTimeout(fourFingerTimeoutId.value)
      fourFingerTimeoutId.value = null
    }
  }
  
  function handleTouchCancel(): void {
    touchCount.value = 0
    if (fourFingerTimeoutId.value) {
      clearTimeout(fourFingerTimeoutId.value)
      fourFingerTimeoutId.value = null
    }
  }
  
  // Setup event listeners
  onMounted(() => {
    if (typeof window === 'undefined') return
    
    // Check if saved position is still valid for current screen size
    const currentPos = position.value
    const validatedPos = applyConstraints(currentPos)
    
    // If position is outside current viewport, center the dock
    if (currentPos.x !== validatedPos.x || currentPos.y !== validatedPos.y) {
      centerDock()
      logger.debug('Dock position adjusted to fit viewport')
    }
    
    // Mouse/touch events for dragging
    window.addEventListener('mousemove', handlePointerMove)
    window.addEventListener('mouseup', handlePointerEnd)
    window.addEventListener('touchmove', handlePointerMove, { passive: false })
    window.addEventListener('touchend', handlePointerEnd)
    
    // Mouse wheel click
    window.addEventListener('mousedown', handleWheelClick)
    
    // Touch gestures for 4-finger detection
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })
    window.addEventListener('touchcancel', handleTouchCancel, { passive: true })
    
    // Update constraints on window resize
    window.addEventListener('resize', () => {
      position.value = applyConstraints(position.value)
    })
    
    logger.debug('FloatingDock initialized', { 
      position: position.value,
      autoHide: isAutoHideEnabled.value 
    })
  })
  
  // Cleanup
  onUnmounted(() => {
    if (typeof window === 'undefined') return
    
    clearAutoHideTimer()
    
    if (fourFingerTimeoutId.value) {
      clearTimeout(fourFingerTimeoutId.value)
    }
    
    window.removeEventListener('mousemove', handlePointerMove)
    window.removeEventListener('mouseup', handlePointerEnd)
    window.removeEventListener('touchmove', handlePointerMove)
    window.removeEventListener('touchend', handlePointerEnd)
    window.removeEventListener('mousedown', handleWheelClick)
    window.removeEventListener('touchstart', handleTouchStart)
    window.removeEventListener('touchend', handleTouchEnd)
    window.removeEventListener('touchcancel', handleTouchCancel)
  })
  
  return {
    // Position
    position: readonly(position),
    dockPosition: readonly(dockPosition),
    
    // Visibility
    isVisible: readonly(isVisible),
    isAutoHideEnabled: readonly(isAutoHideEnabled),
    
    // Drag state
    isDragging: readonly(isDragging),
    
    // Methods
    show,
    hide,
    toggle,
    toggleAutoHide,
    centerDock,
    updateInteractionTime,
    
    // Drag methods
    startDrag,
    
    // Gesture handlers
    handleWheelClick,
    handleFourFingerTouch
  }
}