<template>
  <div class="h-full w-full flex flex-col items-center justify-center p-6 space-y-6">
      <!-- Timer Display -->
      <div class="text-center space-y-2">
        <div 
          class="font-mono font-bold transition-all duration-300"
          :class="[
            timerSizeClass,
            timerColorClass
          ]"
        >
          {{ timer.formattedTime.value }}
        </div>
        
        <!-- Status Badge -->
        <Badge 
          v-if="timer.status.value !== 'idle'"
          :variant="badgeVariant"
          class="text-xs"
        >
          {{ statusText }}
        </Badge>
      </div>

      <!-- Quick Duration Buttons -->
      <div class="flex gap-2 flex-wrap justify-center">
        <Button
          v-for="preset in durationPresets"
          :key="preset.value"
          @click="handlePresetClick(preset.value)"
          variant="outline"
          size="sm"
          :disabled="timer.isRunning.value || timer.isPaused.value"
          class="min-w-[60px]"
        >
          {{ preset.label }}
        </Button>
      </div>

      <!-- Main Control Button -->
      <Button
        @click="handleMainButtonClick"
        :variant="mainButtonVariant"
        size="lg"
        class="min-w-[120px] text-lg"
      >
        <component :is="mainButtonIcon" class="w-5 h-5 mr-2" />
        {{ mainButtonText }}
      </Button>

      <!-- Secondary Actions -->
      <div v-if="timer.isPaused.value || timer.status.value === 'completed'" class="flex gap-2">
        <Button
          @click="timer.reset"
          variant="outline"
          size="sm"
        >
          <RotateCcw class="w-4 h-4 mr-1" />
          {{ t('buttons.reset') }}
        </Button>
      </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Play, Pause, RotateCcw } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { TimerWidgetConfig } from './definition'
import { useTimer } from './composables/useTimer'

const props = defineProps<TimerWidgetConfig>()

// i18n
const { t } = useI18n()

// Duration presets
const durationPresets = [
  { label: t('presets.5min'), value: 300 },
  { label: t('presets.10min'), value: 600 },
  { label: t('presets.25min'), value: 1500 } // Pomodoro
]

// Initialize timer
const timer = useTimer({
  defaultDuration: props.defaultDuration,
  onComplete: () => {
    if (props.enableSound) {
      playCompletionSound()
    }
    if (props.autoRepeat) {
      setTimeout(() => {
        timer.setDuration(props.defaultDuration)
        timer.start()
      }, 1000)
    }
  }
})

// Computed properties
const mainButtonText = computed(() => {
  if (timer.isRunning.value) return t('buttons.pause')
  if (timer.isPaused.value) return t('buttons.resume')
  if (timer.status.value === 'completed') return t('buttons.startAgain')
  return t('buttons.start')
})

const mainButtonIcon = computed(() => {
  if (timer.isRunning.value) return Pause
  return Play
})

const mainButtonVariant = computed(() => {
  if (timer.isRunning.value) return 'default' as const
  return props.variant as 'default' | 'secondary' | 'outline' | 'ghost'
})

const statusText = computed(() => {
  switch (timer.status.value) {
    case 'running': return t('status.running')
    case 'paused': return t('status.paused')
    case 'completed': return t('status.completed')
    case 'idle': return t('status.idle')
    default: return ''
  }
})

const badgeVariant = computed(() => {
  switch (timer.status.value) {
    case 'running': return 'default' as const
    case 'paused': return 'secondary' as const
    case 'completed': return 'outline' as const
    default: return 'default' as const
  }
})

const timerSizeClass = computed(() => {
  switch (props.size) {
    case 'small': return 'text-3xl'
    case 'large': return 'text-6xl'
    default: return 'text-5xl'
  }
})

const timerColorClass = computed(() => {
  if (timer.status.value === 'completed') return 'text-green-600 dark:text-green-400'
  if (timer.isRunning.value) return 'text-foreground'
  return 'text-muted-foreground'
})

// Methods
const handleMainButtonClick = () => {
  if (timer.isRunning.value) {
    timer.pause()
  } else if (timer.isPaused.value) {
    timer.resume()
  } else if (timer.status.value === 'completed') {
    timer.reset()
    timer.setDuration(props.defaultDuration)
    timer.start()
  } else {
    timer.start()
  }
}

const handlePresetClick = (seconds: number) => {
  timer.setDuration(seconds)
}

const playCompletionSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    // Simple pleasant beep
    oscillator.frequency.value = 800
    gainNode.gain.value = 0.3
    
    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.2)
  } catch (error) {
    console.error('Failed to play sound:', error)
  }
}

// Cleanup
onUnmounted(() => {
  timer.cleanup()
})
</script>