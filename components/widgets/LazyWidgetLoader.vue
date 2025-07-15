<template>
  <div 
    ref="containerRef"
    class="widget-lazy-loader"
    :style="placeholderStyle"
  >
    <Transition name="widget-fade" mode="out-in">
      <!-- Loading placeholder -->
      <LoadingPlaceholder 
        v-if="!isLoaded && isVisible"
        :type="getSkeletonType"
        :show-skeleton="true"
        class="h-full"
      />
      
      <!-- Actual widget component -->
      <component
        v-else-if="isLoaded && widgetComponent"
        :is="widgetComponent"
        v-bind="widgetProps"
        @mounted="handleWidgetMounted"
        @error="handleWidgetError"
      />
      
      <!-- Error state -->
      <div v-else-if="error" class="widget-error">
        <p class="text-sm text-destructive">Failed to load widget</p>
        <Button size="sm" variant="outline" @click="retry">
          Retry
        </Button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, defineAsyncComponent, type Component } from 'vue'
import type { WidgetInstance } from '~/types/widgets'
import { usePerformanceOptimization } from '~/composables/performance/usePerformanceOptimization'
import { useWidgetEventBus } from '~/composables/events/useWidgetEventBus'
import LoadingPlaceholder from '~/components/common/LoadingPlaceholder.vue'
import { Button } from '~/components/ui/button'

interface Props {
  widgetInstance: WidgetInstance
  priority?: 'high' | 'low'
  placeholderHeight?: number
  preload?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  priority: 'low',
  placeholderHeight: 200,
  preload: false
})

const emit = defineEmits<{
  loaded: []
  error: [error: Error]
}>()

const containerRef = ref<HTMLElement>()
const isVisible = ref(false)
const isLoaded = ref(false)
const error = ref<Error | null>(null)
const widgetComponent = ref<Component | null>(null)
const eventBus = useWidgetEventBus()

const { useLazyLoad } = usePerformanceOptimization()

// Widget type and props
const widgetType = computed(() => props.widgetInstance.type)
const widgetProps = computed(() => ({
  widgetInstance: props.widgetInstance,
  config: props.widgetInstance.config
}))

// Get appropriate skeleton type for the widget
const getSkeletonType = computed(() => {
  const typeMap: Record<string, 'clock' | 'weather' | 'widget'> = {
    clock: 'clock',
    weather: 'weather',
    calendar: 'widget',
    note: 'widget',
    timer: 'widget'
  }
  return typeMap[widgetType.value] || 'widget'
})

// Placeholder styling
const placeholderStyle = computed(() => ({
  minHeight: `${props.placeholderHeight}px`,
  position: 'relative' as const
}))

// Widget component map
const widgetComponents: Record<string, () => Promise<Component>> = {
  clock: () => import('~/components/widgets/Clock/index.vue'),
  weather: () => import('~/components/widgets/Weather/index.vue'),
  calendar: () => import('~/components/widgets/Calendar/index.vue'),
  note: () => import('~/components/widgets/Note/index.vue'),
  timer: () => import('~/components/widgets/Timer/index.vue')
}

// Load widget component
const loadWidget = async () => {
  if (isLoaded.value || !isVisible.value) return
  
  try {
    await eventBus.emit('widget:loading', props.widgetInstance.id, true)
    
    const loader = widgetComponents[widgetType.value]
    if (!loader) {
      throw new Error(`Unknown widget type: ${widgetType.value}`)
    }
    
    // Create async component with error handling
    widgetComponent.value = defineAsyncComponent({
      loader,
      loadingComponent: null, // We handle loading state ourselves
      errorComponent: null, // We handle error state ourselves
      delay: 0,
      timeout: 30000, // 30 seconds timeout
      onError(error, retry, fail) {
        console.error(`Failed to load widget ${widgetType.value}:`, error)
        fail()
      }
    })
    
    isLoaded.value = true
    await eventBus.emit('widget:loading', props.widgetInstance.id, false)
    emit('loaded')
  } catch (err) {
    error.value = err as Error
    await eventBus.emit('widget:error', props.widgetInstance.id, err as Error)
    emit('error', err as Error)
  }
}

// Retry loading
const retry = () => {
  error.value = null
  isLoaded.value = false
  loadWidget()
}

// Handle widget events
const handleWidgetMounted = () => {
  console.log(`Widget ${widgetType.value} mounted`)
}

const handleWidgetError = (err: Error) => {
  error.value = err
  eventBus.emit('widget:error', props.widgetInstance.id, err)
}

// Setup lazy loading
onMounted(() => {
  if (props.preload || props.priority === 'high') {
    // Load immediately for high priority widgets
    isVisible.value = true
    loadWidget()
  } else {
    // Setup intersection observer for lazy loading
    const { observe } = useLazyLoad(
      (entry) => {
        if (entry.isIntersecting && !isLoaded.value) {
          isVisible.value = true
          loadWidget()
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before visible
        threshold: 0.01 // Trigger when 1% visible
      }
    )
    
    if (containerRef.value) {
      observe(containerRef.value)
    }
  }
})
</script>

<style scoped>
.widget-lazy-loader {
  width: 100%;
  height: 100%;
}

.widget-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: inherit;
  gap: 1rem;
}

/* Transition styles */
.widget-fade-enter-active,
.widget-fade-leave-active {
  transition: opacity 0.3s ease;
}

.widget-fade-enter-from,
.widget-fade-leave-to {
  opacity: 0;
}
</style>