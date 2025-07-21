import { ref, computed, watch } from 'vue'

export interface UseTimerOptions {
  defaultDuration: number
  onComplete?: () => void
  onTick?: (timeLeft: number) => void
}

export function useTimer(options: UseTimerOptions) {
  const { defaultDuration, onComplete, onTick } = options

  // State
  const duration = ref(defaultDuration)
  const timeLeft = ref(defaultDuration)
  const isRunning = ref(false)
  const isPaused = ref(false)
  const intervalId = ref<number | null>(null)
  const startTime = ref<number | null>(null)
  const pausedTimeLeft = ref<number | null>(null)

  // Computed
  const progress = computed(() => {
    if (duration.value === 0) return 0
    return ((duration.value - timeLeft.value) / duration.value) * 100
  })

  const formattedTime = computed(() => {
    const totalSeconds = Math.max(0, Math.ceil(timeLeft.value))
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  })

  const status = computed(() => {
    if (isRunning.value) return 'running'
    if (isPaused.value) return 'paused'
    if (timeLeft.value === 0) return 'completed'
    return 'idle'
  })

  // Methods
  const tick = () => {
    if (!startTime.value || !isRunning.value) return

    const elapsed = (Date.now() - startTime.value) / 1000
    const baseTime = pausedTimeLeft.value ?? duration.value
    timeLeft.value = Math.max(0, baseTime - elapsed)

    if (onTick) {
      onTick(timeLeft.value)
    }

    if (timeLeft.value <= 0) {
      complete()
    }
  }

  const start = () => {
    if (isRunning.value) return

    isRunning.value = true
    isPaused.value = false
    startTime.value = Date.now()
    pausedTimeLeft.value = null

    intervalId.value = window.setInterval(tick, 100)
  }

  const pause = () => {
    if (!isRunning.value) return

    isRunning.value = false
    isPaused.value = true
    pausedTimeLeft.value = timeLeft.value

    if (intervalId.value) {
      clearInterval(intervalId.value)
      intervalId.value = null
    }
  }

  const resume = () => {
    if (!isPaused.value) return

    isRunning.value = true
    isPaused.value = false
    startTime.value = Date.now()

    intervalId.value = window.setInterval(tick, 100)
  }

  const reset = () => {
    isRunning.value = false
    isPaused.value = false
    timeLeft.value = duration.value
    startTime.value = null
    pausedTimeLeft.value = null

    if (intervalId.value) {
      clearInterval(intervalId.value)
      intervalId.value = null
    }
  }

  const setDuration = (seconds: number) => {
    if (isRunning.value || isPaused.value) return
    
    duration.value = seconds
    timeLeft.value = seconds
  }

  const complete = () => {
    isRunning.value = false
    isPaused.value = false
    
    if (intervalId.value) {
      clearInterval(intervalId.value)
      intervalId.value = null
    }

    if (onComplete) {
      onComplete()
    }
  }

  // Cleanup
  const cleanup = () => {
    if (intervalId.value) {
      clearInterval(intervalId.value)
      intervalId.value = null
    }
  }

  // Watch for external duration changes
  watch(() => defaultDuration, (newDuration) => {
    if (!isRunning.value && !isPaused.value) {
      duration.value = newDuration
      timeLeft.value = newDuration
    }
  })

  return {
    // State
    duration: computed(() => duration.value),
    timeLeft: computed(() => timeLeft.value),
    isRunning: computed(() => isRunning.value),
    isPaused: computed(() => isPaused.value),
    status,
    
    // Computed
    progress,
    formattedTime,
    
    // Methods
    start,
    pause,
    resume,
    reset,
    setDuration,
    cleanup
  }
}