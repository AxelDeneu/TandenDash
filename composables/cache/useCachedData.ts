import { useCache, useGlobalCacheInvalidation } from './useCache'
import { useWidgetEventBus } from '../events/useWidgetEventBus'
import type { WidgetInstance } from '~/types/widgets'
import type { Page } from '~/types/page'

/**
 * Cached pages fetcher
 */
export function useCachedPages() {
  const eventBus = useWidgetEventBus()
  const { invalidateByTags } = useGlobalCacheInvalidation()
  
  const cache = useCache<Page[]>(
    async () => {
      const response = await $fetch('/api/pages')
      return Array.isArray(response) ? response : []
    },
    {
      key: 'pages:all',
      ttl: 5 * 60 * 1000, // 5 minutes
      tags: ['pages']
    }
  )
  
  // Listen for page events to invalidate cache
  onMounted(async () => {
    await eventBus.on('page:created', () => {
      cache.invalidate()
    })
    
    await eventBus.on('page:updated', () => {
      cache.invalidate()
    })
    
    await eventBus.on('page:deleted', () => {
      cache.invalidate()
    })
  })
  
  return cache
}

/**
 * Cached widgets fetcher
 */
export function useCachedWidgets(pageId?: Ref<number | undefined>) {
  const eventBus = useWidgetEventBus()
  const { invalidateByTags } = useGlobalCacheInvalidation()
  
  const cache = useCache<WidgetInstance[]>(
    async () => {
      const url = pageId?.value 
        ? `/api/widgets-instances?pageId=${pageId.value}` 
        : '/api/widgets-instances'
      const response = await $fetch(url)
      return Array.isArray(response) ? response : []
    },
    {
      key: computed(() => pageId?.value ? `widgets:page:${pageId.value}` : 'widgets:all'),
      ttl: 3 * 60 * 1000, // 3 minutes
      tags: computed(() => pageId?.value ? ['widgets', `widgets:page:${pageId.value}`] : ['widgets'])
    }
  )
  
  // Watch for page changes
  if (pageId) {
    watch(pageId, () => {
      cache.invalidate()
    })
  }
  
  // Listen for widget events to invalidate cache
  onMounted(async () => {
    await eventBus.on('widget:created', (widget) => {
      if (!pageId?.value || widget.pageId === pageId.value) {
        cache.invalidate()
      }
    })
    
    await eventBus.on('widget:updated', (widget) => {
      if (!pageId?.value || widget.pageId === pageId.value) {
        cache.invalidate()
      }
    })
    
    await eventBus.on('widget:deleted', () => {
      cache.invalidate()
    })
  })
  
  return cache
}

/**
 * Cached page with widgets fetcher
 */
export function useCachedPageWithWidgets(pageId: Ref<number>) {
  const eventBus = useWidgetEventBus()
  
  const cache = useCache(
    async () => {
      const [pageResponse, widgetsResponse] = await Promise.all([
        $fetch(`/api/pages/${pageId.value}`),
        $fetch(`/api/widgets-instances?pageId=${pageId.value}`)
      ])
      
      return {
        page: pageResponse,
        widgets: Array.isArray(widgetsResponse) ? widgetsResponse : []
      }
    },
    {
      key: computed(() => `page:${pageId.value}:with-widgets`),
      ttl: 2 * 60 * 1000, // 2 minutes
      tags: computed(() => ['pages', 'widgets', `page:${pageId.value}`])
    }
  )
  
  // Watch for page changes
  watch(pageId, () => {
    cache.invalidate()
  })
  
  // Listen for events
  onMounted(async () => {
    await eventBus.on('page:updated', (updatedPageId) => {
      if (updatedPageId === pageId.value) {
        cache.invalidate()
      }
    })
    
    await eventBus.on('widget:created', (widget) => {
      if (widget.pageId === pageId.value) {
        cache.invalidate()
      }
    })
    
    await eventBus.on('widget:updated', (widget) => {
      if (widget.pageId === pageId.value) {
        cache.invalidate()
      }
    })
    
    await eventBus.on('widget:deleted', () => {
      cache.invalidate()
    })
  })
  
  return cache
}