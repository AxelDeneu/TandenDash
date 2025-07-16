<template>
  <div 
    class="h-full w-full flex flex-col items-center justify-center p-4"
    :class="[
      backgroundColor,
      showBorder ? `border-2 ${borderColor}` : ''
    ]"
    :style="{
      borderRadius: `${borderRadius}px`
    }"
  >
    <!-- Timer Display -->
    <div 
      class="font-mono font-bold mb-6"
      :class="timerColor"
      :style="{ fontSize: `${fontSize}px` }"
    >
      {{ formattedTime }}
    </div>
    
    <!-- Progress Bar -->
    <div 
      v-if="showProgressBar && (isRunning || isPaused)"
      class="w-full mb-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
      :style="{ height: `${progressBarHeight}px` }"
    >
      <div 
        class="h-full transition-all duration-300"
        :class="progressBarColor"
        :style="{ width: `${progress}%` }"
      />
    </div>
    
    <!-- Control Buttons -->
    <div class="flex gap-3">
      <button
        v-if="!isRunning && !isPaused"
        @click="startTimer"
        class="px-6 py-3 rounded-lg font-medium transition-all hover:scale-105"
        :class="buttonColor"
      >
        <Play class="w-5 h-5 inline mr-2" />
        Start
      </button>
      
      <button
        v-if="isRunning"
        @click="pauseTimer"
        class="px-6 py-3 rounded-lg font-medium transition-all hover:scale-105"
        :class="buttonColor"
      >
        <Pause class="w-5 h-5 inline mr-2" />
        Pause
      </button>
      
      <button
        v-if="isPaused"
        @click="resumeTimer"
        class="px-6 py-3 rounded-lg font-medium transition-all hover:scale-105"
        :class="buttonColor"
      >
        <Play class="w-5 h-5 inline mr-2" />
        Resume
      </button>
      
      <button
        v-if="isRunning || isPaused"
        @click="resetTimer"
        class="px-6 py-3 rounded-lg font-medium transition-all hover:scale-105 bg-gray-500 text-white"
      >
        <RotateCcw class="w-5 h-5 inline mr-2" />
        Reset
      </button>
    </div>
    
    <!-- Quick Time Buttons -->
    <div class="mt-4 flex gap-2">
      <button
        v-for="duration in quickDurations"
        :key="duration.seconds"
        @click="setDuration(duration.seconds)"
        class="px-3 py-1 text-sm rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
      >
        {{ duration.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted, watch } from 'vue'
import { Play, Pause, RotateCcw } from 'lucide-vue-next'
import type { TimerWidgetConfig } from './definition'

const props = defineProps<TimerWidgetConfig>()

// State
const currentTime = ref(props.defaultDuration)
const isRunning = ref(false)
const isPaused = ref(false)
const intervalId = ref<number | null>(null)
const startTime = ref<number | null>(null)
const pausedTime = ref<number | null>(null)

// Quick duration presets
const quickDurations = [
  { label: '1m', seconds: 60 },
  { label: '5m', seconds: 300 },
  { label: '10m', seconds: 600 },
  { label: '15m', seconds: 900 },
  { label: '30m', seconds: 1800 },
  { label: '1h', seconds: 3600 }
]

// Computed
const formattedTime = computed(() => {
  const totalSeconds = Math.max(0, Math.ceil(currentTime.value))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const milliseconds = Math.floor((currentTime.value % 1) * 1000)
  
  let timeStr = ''
  
  if (props.showHours || hours > 0) {
    timeStr = `${hours.toString().padStart(2, '0')}:`
  }
  
  timeStr += `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  
  if (props.showMilliseconds) {
    timeStr += `.${milliseconds.toString().padStart(3, '0')}`
  }
  
  return timeStr
})

const progress = computed(() => {
  if (!isRunning.value && !isPaused.value) return 0
  return ((props.defaultDuration - currentTime.value) / props.defaultDuration) * 100
})

// Methods
const startTimer = () => {
  isRunning.value = true
  isPaused.value = false
  startTime.value = Date.now()
  
  intervalId.value = window.setInterval(() => {
    updateTimer()
  }, props.showMilliseconds ? 10 : 100)
}

const pauseTimer = () => {
  isRunning.value = false
  isPaused.value = true
  pausedTime.value = currentTime.value
  
  if (intervalId.value) {
    clearInterval(intervalId.value)
    intervalId.value = null
  }
}

const resumeTimer = () => {
  isRunning.value = true
  isPaused.value = false
  startTime.value = Date.now()
  
  intervalId.value = window.setInterval(() => {
    updateTimer()
  }, props.showMilliseconds ? 10 : 100)
}

const resetTimer = () => {
  isRunning.value = false
  isPaused.value = false
  currentTime.value = props.defaultDuration
  startTime.value = null
  pausedTime.value = null
  
  if (intervalId.value) {
    clearInterval(intervalId.value)
    intervalId.value = null
  }
}

const setDuration = (seconds: number) => {
  if (!isRunning.value && !isPaused.value) {
    currentTime.value = seconds
  }
}

const updateTimer = () => {
  if (!startTime.value) return
  
  const elapsed = (Date.now() - startTime.value) / 1000
  const baseTime = pausedTime.value !== null ? pausedTime.value : props.defaultDuration
  currentTime.value = Math.max(0, baseTime - elapsed)
  
  if (currentTime.value <= 0) {
    timerComplete()
  }
}

const timerComplete = () => {
  isRunning.value = false
  isPaused.value = false
  
  if (intervalId.value) {
    clearInterval(intervalId.value)
    intervalId.value = null
  }
  
  // Play sound if enabled
  if (props.enableSound) {
    playSound()
  }
  
  // Auto repeat if enabled
  if (props.autoRepeat) {
    currentTime.value = props.defaultDuration
    setTimeout(startTimer, 1000)
  }
}

const playSound = () => {
  // Create a simple beep sound
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()
  
  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)
  
  oscillator.frequency.value = 800 // Frequency in Hz
  gainNode.gain.value = props.soundVolume
  
  oscillator.start()
  oscillator.stop(audioContext.currentTime + 0.2) // Beep for 0.2 seconds
}

// Watch for defaultDuration changes
watch(() => props.defaultDuration, (newDuration) => {
  if (!isRunning.value && !isPaused.value) {
    currentTime.value = newDuration
  }
})

// Cleanup
onUnmounted(() => {
  if (intervalId.value) {
    clearInterval(intervalId.value)
  }
})
</script>