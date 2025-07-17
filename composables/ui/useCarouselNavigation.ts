import { ref, computed, watch, type Ref, type ComputedRef } from 'vue'
import type { Carousel } from '@/components/ui/carousel'
import { useSwipeGesture } from '@/composables'
import type { Page } from '@/types'

export interface UseCarouselNavigation {
  carouselRef: Ref<InstanceType<typeof Carousel> | null>
  swipeContainer: Ref<HTMLElement | null>
  currentPageIndex: Ref<number>
  currentPage: ComputedRef<Page | null>
  
  setupSwipeHandlers(pages: Ref<Page[]>, editMode: ComputedRef<boolean>): void
  resetPageIndex(pages: Page[]): void
}

export function useCarouselNavigation(pages: Ref<Page[]>): UseCarouselNavigation {
  // Carousel and navigation state
  const carouselRef = ref<InstanceType<typeof Carousel> | null>(null)
  const swipeContainer = ref<HTMLElement | null>(null)
  const currentPageIndex = ref(0)
  
  // Current page based on index
  const currentPage = computed(() => pages.value[currentPageIndex.value] || null)
  
  // Setup swipe gestures (only when carousel drag is disabled)
  const { onSwipeLeft, onSwipeRight } = useSwipeGesture(swipeContainer, {
    threshold: 50,
    timeout: 300,
    preventDefault: false // Let carousel handle drag when enabled
  })
  
  // Setup swipe handlers for edit mode
  function setupSwipeHandlers(pagesRef: Ref<Page[]>, editMode: ComputedRef<boolean>): void {
    // Swipe left handler - only active when carousel drag is disabled
    onSwipeLeft.value = () => {
      if (editMode.value && carouselRef.value?.scrollNext) {
        carouselRef.value.scrollNext()
        if (currentPageIndex.value < pagesRef.value.length - 1) {
          currentPageIndex.value++
        }
      }
    }
    
    // Swipe right handler - only active when carousel drag is disabled
    onSwipeRight.value = () => {
      if (editMode.value && carouselRef.value?.scrollPrev) {
        carouselRef.value.scrollPrev()
        if (currentPageIndex.value > 0) {
          currentPageIndex.value--
        }
      }
    }
  }
  
  // Reset page index when pages change
  function resetPageIndex(newPages: Page[]): void {
    if (newPages.length > 0 && currentPageIndex.value >= newPages.length) {
      currentPageIndex.value = 0
    }
  }
  
  // Watch for page changes to reset index
  watch(pages, (newPages) => {
    resetPageIndex(newPages)
  })
  
  return {
    carouselRef,
    swipeContainer,
    currentPageIndex,
    currentPage,
    setupSwipeHandlers,
    resetPageIndex
  }
}