<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { cn } from '../../lib/utils';
import { applySecondsAnimation } from './animations';
import { fontSizeStyle, toPixels } from '../../lib/utils/font-sizes';
import type { ClockWidgetConfig } from "./definition";
import translations from './lang/index';

// Define props
const props = defineProps<ClockWidgetConfig>();

// Load translations
const { mergeLocaleMessage } = useI18n();

// Merge translations for all available locales
Object.entries(translations).forEach(([locale, messages]) => {
  mergeLocaleMessage(locale, { widget_clock: messages });
});

// Reactive time and date
const time = ref('');
const date = ref('');

// Update time
const updateTime = () => {
  const now = new Date();
  time.value = now.toLocaleTimeString(undefined, {
    hour12: props.format === '12',
    hour: '2-digit',
    minute: '2-digit',
    ...(props.showSeconds ? { second: '2-digit' } : {})
  });

  if (props.showDate) {
    date.value = now.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
};

// Manage update interval
let interval: NodeJS.Timeout;
onMounted(() => {
  updateTime();
  interval = setInterval(updateTime, 1000);

  // Watch seconds animations if enabled
  if (props.animateSeconds) {
    nextTick(() => {
      const secondsElement = document.querySelector('[data-testid="seconds"]');
      if (secondsElement) {
        applySecondsAnimation(secondsElement as HTMLElement, props.secondsAnimation || 'bounce');
      }
    });
  }
});
onUnmounted(() => {
  clearInterval(interval);
});

// Dynamic classes
const clockAlignmentClass = computed(() =>
    cn(
        'flex items-center justify-center',
        props.alignment === 'horizontal'
            ? `flex-row ${props.timeSeparatorSpacing || 'space-x-1'}`
            : `flex-col ${props.timeSeparatorSpacing || 'space-y-1'}`
    )
);

const separatorClass = computed(() =>
    cn('transition-opacity', {
      'opacity-100': !props.animateSeparator,
      'animate-blink': props.animateSeparator
    })
);

const separatorStyle = computed(() => fontSizeStyle(props.separatorSize || 20));

const dateSpacingClass = computed(() =>
    cn(props.dateSpacing || 'mt-2', 'text-lg text-center')
);

// Additional classes
const hourClass = computed(() =>
  cn(
    'font-bold relative tabular-nums',
    props.hourColor || 'text-foreground'
  )
);
const hourStyle = computed(() => fontSizeStyle(props.hourSize || 36));

const minuteClass = computed(() =>
  cn(
    'font-bold relative tabular-nums',
    props.minuteColor || 'text-foreground'
  )
);
const minuteStyle = computed(() => fontSizeStyle(props.minuteSize || 36));

const secondClass = computed(() =>
  cn(
    'font-bold relative tabular-nums',
    props.secondColor || 'text-foreground'
  )
);
const secondStyle = computed(() => fontSizeStyle(props.secondSize || 36));
</script>

<template>
  <div class="h-full w-full flex flex-col items-center justify-center">
    <!-- Clock -->
    <div :class="clockAlignmentClass">
      <!-- Hours -->
      <div :class="hourClass" :style="hourStyle" data-testid="hours">
        {{ time.split(':')[0] }}
      </div>

      <!-- Separator between hours and minutes -->
      <div v-if="separator" :class="separatorClass" :style="separatorStyle" data-testid="separator">
        {{ separator }}
      </div>

      <!-- Minutes -->
      <div :class="minuteClass" :style="minuteStyle" data-testid="minutes">
        {{ time.split(':')[1] }}
      </div>

      <!-- Separator between minutes and seconds -->
      <div v-if="separator && showSeconds" :class="separatorClass" :style="separatorStyle" data-testid="separator">
        {{ separator }}
      </div>

      <!-- Seconds -->
      <div v-if="showSeconds" :class="secondClass" :style="secondStyle" data-testid="seconds">
        {{ time.split(':')[2] || '00' }}
      </div>
    </div>

    <!-- Date -->
    <div v-if="showDate" :class="dateSpacingClass" data-testid="date">
      {{ date }}
    </div>
  </div>
</template>