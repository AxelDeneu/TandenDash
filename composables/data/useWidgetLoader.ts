import { ref, watch, type Ref } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { useWidgetOperations, useComposableContext } from '@/composables'
import type { Page } from '@/types'

export interface UseWidgetLoader {
  loadedPageIds: Ref<Set<number>>
  
  fetchWidgetsForPage(pageId: number): Promise<void>
  debouncedFetchWidgets(pageId: number): void
  setupAutoLoader(pages: Ref<Page[]>): void
  markPageForRefresh(pageId: number): void
}

export function useWidgetLoader(): UseWidgetLoader {
  const widgetOperations = useWidgetOperations()
  const context = useComposableContext()
  
  // Track loaded pages to avoid duplicate fetches
  const loadedPageIds = ref(new Set<number>())
  
  // Fetch widgets for a specific page
  async function fetchWidgetsForPage(pageId: number): Promise<void> {
    try {
      console.log(`[WidgetLoader] Fetching widgets for page ${pageId}`)
      await widgetOperations.fetchWidgets(pageId)
      loadedPageIds.value.add(pageId)
      console.log(`[WidgetLoader] Successfully loaded widgets for page ${pageId}`)
    } catch (error) {
      console.error(`[WidgetLoader] Failed to fetch widgets for page ${pageId}:`, error)
      // Remove from loaded pages on error so it can be retried
      loadedPageIds.value.delete(pageId)
    }
  }
  
  // Debounced fetch function to avoid too many requests
  const debouncedFetchWidgets = useDebounceFn(async (pageId: number) => {
    // Mark page as needing refresh
    loadedPageIds.value.delete(pageId)
    await fetchWidgetsForPage(pageId)
  }, 1000)
  
  // Mark a page as needing refresh
  function markPageForRefresh(pageId: number): void {
    loadedPageIds.value.delete(pageId)
  }
  
  // Setup automatic widget loading when pages change
  function setupAutoLoader(pages: Ref<Page[]>): void {
    watch(pages, async (newPages) => {
      // Ensure newPages is an array before iterating
      if (!Array.isArray(newPages)) return
      
      // Only fetch widgets for pages that haven't been loaded yet
      for (const page of newPages) {
        if (!loadedPageIds.value.has(page.id)) {
          // Add a small delay between requests to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100))
          await fetchWidgetsForPage(page.id)
        }
      }
    }, { immediate: true })
  }
  
  return {
    loadedPageIds,
    fetchWidgetsForPage,
    debouncedFetchWidgets,
    setupAutoLoader,
    markPageForRefresh
  }
}