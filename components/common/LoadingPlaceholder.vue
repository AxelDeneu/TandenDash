<template>
  <div :class="containerClasses">
    <div v-if="showSkeleton" class="skeleton-content">
      <!-- Widget placeholder skeletons -->
      <div v-if="type === 'widget'" class="widget-skeleton">
        <div class="skeleton-header">
          <div class="skeleton-title shimmer"></div>
          <div class="skeleton-actions shimmer"></div>
        </div>
        <div class="skeleton-body">
          <div class="skeleton-line shimmer"></div>
          <div class="skeleton-line short shimmer"></div>
          <div class="skeleton-line shimmer"></div>
        </div>
      </div>
      
      <!-- Clock widget skeleton -->
      <div v-else-if="type === 'clock'" class="clock-skeleton">
        <div class="clock-time">
          <div class="clock-digits shimmer"></div>
          <div class="clock-separator shimmer"></div>
          <div class="clock-digits shimmer"></div>
        </div>
        <div class="clock-date shimmer"></div>
      </div>
      
      <!-- Weather widget skeleton -->
      <div v-else-if="type === 'weather'" class="weather-skeleton">
        <div class="weather-header">
          <div class="weather-icon shimmer"></div>
          <div class="weather-temp shimmer"></div>
        </div>
        <div class="weather-details">
          <div class="weather-location shimmer"></div>
          <div class="weather-condition shimmer"></div>
        </div>
      </div>
      
      
      <!-- Page placeholder skeletons -->
      <div v-else-if="type === 'page'" class="page-skeleton">
        <div class="skeleton-page-header shimmer"></div>
        <div class="skeleton-widgets-grid">
          <div v-for="i in 3" :key="i" class="skeleton-widget-card shimmer"></div>
        </div>
      </div>
      
      <!-- Dialog placeholder -->
      <div v-else-if="type === 'dialog'" class="dialog-skeleton">
        <div class="skeleton-dialog-header shimmer"></div>
        <div class="skeleton-dialog-content">
          <div class="skeleton-form-field shimmer"></div>
          <div class="skeleton-form-field shimmer"></div>
          <div class="skeleton-form-field short shimmer"></div>
        </div>
        <div class="skeleton-dialog-actions shimmer"></div>
      </div>
      
      <!-- Generic content placeholder -->
      <div v-else class="generic-skeleton">
        <div class="skeleton-line shimmer"></div>
        <div class="skeleton-line short shimmer"></div>
        <div class="skeleton-line shimmer"></div>
        <div class="skeleton-line shimmer"></div>
      </div>
    </div>
    
    <div v-else class="loading-content">
      <LoadingSpinner :size="spinnerSize" :message="message" :variant="variant" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import LoadingSpinner from './LoadingSpinner.vue'

interface Props {
  type?: 'widget' | 'page' | 'dialog' | 'generic' | 'clock' | 'weather'
  message?: string
  showSkeleton?: boolean
  variant?: 'primary' | 'secondary' | 'muted'
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  type: 'generic',
  showSkeleton: true,
  variant: 'muted',
  size: 'md'
})

const containerClasses = computed(() => [
  'loading-placeholder',
  'flex items-center justify-center p-4',
  {
    'min-h-[200px]': props.type === 'widget',
    'min-h-[400px]': props.type === 'page',
    'min-h-[300px]': props.type === 'dialog',
    'min-h-[100px]': props.type === 'generic'
  }
])

const spinnerSize = computed(() => {
  switch (props.type) {
    case 'page': return 'lg'
    case 'dialog': return 'md'
    case 'widget': return 'sm'
    default: return props.size
  }
})
</script>

<style scoped>
.loading-placeholder {
  @apply w-full bg-muted/10 rounded-lg border border-muted/20;
}

/* Skeleton animations */
.skeleton-content {
  @apply w-full space-y-4;
}

/* Shimmer effect */
.shimmer {
  @apply relative overflow-hidden bg-muted/30;
}

.shimmer::after {
  content: '';
  @apply absolute inset-0 -translate-x-full;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}

.skeleton-line {
  @apply h-4 rounded;
}

.skeleton-line.short {
  @apply w-3/4;
}

/* Widget skeleton */
.widget-skeleton {
  @apply space-y-3;
}

.skeleton-header {
  @apply flex items-center justify-between;
}

.skeleton-title {
  @apply h-5 w-1/3 rounded;
}

.skeleton-actions {
  @apply h-4 w-16 rounded;
}

.skeleton-body {
  @apply space-y-2;
}

/* Clock widget skeleton */
.clock-skeleton {
  @apply flex flex-col items-center justify-center gap-4 py-8;
}

.clock-time {
  @apply flex items-center gap-2;
}

.clock-digits {
  @apply h-16 w-24 rounded-lg;
}

.clock-separator {
  @apply h-12 w-4 rounded;
}

.clock-date {
  @apply h-6 w-32 rounded;
}

/* Weather widget skeleton */
.weather-skeleton {
  @apply space-y-4 p-4;
}

.weather-header {
  @apply flex items-center justify-center gap-4;
}

.weather-icon {
  @apply h-16 w-16 rounded-full;
}

.weather-temp {
  @apply h-12 w-20 rounded;
}

.weather-details {
  @apply space-y-2 flex flex-col items-center;
}

.weather-location {
  @apply h-5 w-32 rounded;
}

.weather-condition {
  @apply h-4 w-24 rounded;
}


/* Page skeleton */
.page-skeleton {
  @apply space-y-6 w-full;
}

.skeleton-page-header {
  @apply h-8 w-1/4 rounded;
}

.skeleton-widgets-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4;
}

.skeleton-widget-card {
  @apply h-32 rounded-lg;
}

/* Dialog skeleton */
.dialog-skeleton {
  @apply space-y-4 w-full;
}

.skeleton-dialog-header {
  @apply h-6 w-1/2 rounded;
}

.skeleton-dialog-content {
  @apply space-y-3;
}

.skeleton-form-field {
  @apply h-10 rounded;
}

.skeleton-form-field.short {
  @apply w-1/2;
}

.skeleton-dialog-actions {
  @apply h-10 w-full rounded;
}

/* Generic skeleton */
.generic-skeleton {
  @apply space-y-3 w-full;
}
</style>