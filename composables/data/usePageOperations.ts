import { ref, computed, readonly, type Ref } from 'vue'
import type { Page, CreatePageRequest, UpdatePageRequest } from '@/types/page'
import { useComposableContext } from '../core/ComposableContext'
import { useErrorHandler } from '../core/useErrorHandler'
import { useLoadingState } from '../core/useLoadingState'

export interface UsePageOperations {
  pages: Ref<Page[]>
  currentPage: Ref<Page | null>
  loading: Ref<boolean>
  error: Ref<Error | null>
  
  fetchPages(): Promise<void>
  fetchPage(id: number): Promise<void>
  createPage(data: CreatePageRequest): Promise<Page>
  updatePage(id: number, data: UpdatePageRequest): Promise<Page>
  deletePage(id: number): Promise<boolean>
  setCurrentPage(page: Page): void
  findPageById(id: number): Page | undefined
  getNextPage(): Page | null
  getPreviousPage(): Page | null
}

export function usePageOperations(): UsePageOperations {
  const context = useComposableContext()
  const pages = ref<Page[]>([])
  const currentPage = ref<Page | null>(null)
  
  const loadingState = useLoadingState()
  const errorHandler = useErrorHandler(async () => {
    if (lastOperation.value) {
      await lastOperation.value()
    }
  })

  const lastOperation = ref<(() => Promise<void>) | null>(null)

  const loading = computed(() => loadingState.isLoading.value)
  const error = computed(() => errorHandler.error.value)

  async function fetchPages(): Promise<void> {
    const operation = async () => {
      const result = await $fetch<Page[]>('/api/pages')
      pages.value = Array.isArray(result) ? result : []
      
      // Set current page if none selected and we have pages
      if (!currentPage.value && pages.value.length > 0) {
        currentPage.value = pages.value[0]
      }
      
      context.events.emit('pages:fetched', pages.value)
    }

    lastOperation.value = operation
    errorHandler.clearError()

    try {
      await loadingState.withLoading(operation, 'fetch-pages')
    } catch (err) {
      errorHandler.handleError(err as Error)
      throw err
    }
  }

  async function fetchPage(id: number): Promise<void> {
    const operation = async () => {
      const page = await $fetch<Page>(`/api/pages/${id}`)
      
      const index = pages.value.findIndex(p => p.id === id)
      if (index >= 0) {
        pages.value[index] = page
      } else {
        pages.value.push(page as Page)
      }
      
      context.events.emit('page:fetched', page as Page)
    }

    errorHandler.clearError()

    try {
      await loadingState.withLoading(operation, 'fetch-page')
    } catch (err) {
      errorHandler.handleError(err as Error)
      throw err
    }
  }

  async function createPage(data: CreatePageRequest): Promise<Page> {
    const operation = async () => {
      const newPage = await $fetch<Page>('/api/pages', {
        method: 'POST',
        body: data
      })
      
      pages.value.push(newPage as Page)
      
      // Set as current page if it's the first one
      if (pages.value.length === 1) {
        currentPage.value = newPage
      }
      
      context.events.emit('page:created', newPage as Page)
      return newPage as Page
    }

    errorHandler.clearError()

    try {
      return await loadingState.withLoading(operation, 'create-page')
    } catch (err) {
      errorHandler.handleError(err as Error)
      throw err
    }
  }

  async function updatePage(id: number, data: UpdatePageRequest): Promise<Page> {
    const operation = async () => {
      const body = { id, ...data }
      const updatedPage = await $fetch<Page>('/api/pages', {
        method: 'PUT',
        body
      })
      
      const index = pages.value.findIndex(p => p.id === id)
      if (index >= 0) {
        pages.value[index] = updatedPage
      }
      
      // Update current page if it's the same
      if (currentPage.value?.id === id) {
        currentPage.value = updatedPage
      }
      
      context.events.emit('page:updated', updatedPage)
      return updatedPage
    }

    errorHandler.clearError()

    try {
      return await loadingState.withLoading(operation, 'update-page')
    } catch (err) {
      errorHandler.handleError(err as Error)
      throw err
    }
  }

  async function deletePage(id: number): Promise<boolean> {
    const operation = async () => {
      await $fetch<void>('/api/pages', {
        method: 'DELETE',
        body: { id }
      })
      
      const index = pages.value.findIndex(p => p.id === id)
      if (index >= 0) {
        const deletedPage = pages.value[index]
        pages.value.splice(index, 1)
        
        // Update current page if deleted
        if (currentPage.value?.id === id) {
          currentPage.value = pages.value.length > 0 ? pages.value[0] : null
        }
        
        context.events.emit('page:deleted', deletedPage.id)
      }
      
      return true
    }

    errorHandler.clearError()

    try {
      return await loadingState.withLoading(operation, 'delete-page')
    } catch (err) {
      errorHandler.handleError(err as Error)
      throw err
    }
  }

  function setCurrentPage(page: Page): void {
    currentPage.value = page
    context.events.emit('page:current-changed', page)
  }

  // Additional utility methods
  function findPageById(id: number): Page | undefined {
    return pages.value.find(p => p.id === id)
  }

  function getNextPage(): Page | null {
    if (!currentPage.value || pages.value.length <= 1) return null
    
    const currentIndex = pages.value.findIndex(p => p.id === currentPage.value!.id)
    const nextIndex = (currentIndex + 1) % pages.value.length
    return pages.value[nextIndex]
  }

  function getPreviousPage(): Page | null {
    if (!currentPage.value || pages.value.length <= 1) return null
    
    const currentIndex = pages.value.findIndex(p => p.id === currentPage.value!.id)
    const prevIndex = currentIndex === 0 ? pages.value.length - 1 : currentIndex - 1
    return pages.value[prevIndex]
  }

  // Subscribe to external page changes
  context.events.on('page:external-update', (updatedPage: Page) => {
    const index = pages.value.findIndex(p => p.id === updatedPage.id)
    if (index >= 0) {
      pages.value[index] = updatedPage
      if (currentPage.value?.id === updatedPage.id) {
        currentPage.value = updatedPage
      }
    }
  })

  context.events.on('page:external-delete', (pageId: number) => {
    const index = pages.value.findIndex(p => p.id === pageId)
    if (index >= 0) {
      pages.value.splice(index, 1)
      if (currentPage.value?.id === pageId) {
        currentPage.value = pages.value.length > 0 ? pages.value[0] : null
      }
    }
  })

  return {
    pages: readonly(pages),
    currentPage: readonly(currentPage),
    loading,
    error,
    fetchPages,
    fetchPage,
    createPage,
    updatePage,
    deletePage,
    setCurrentPage,
    findPageById,
    getNextPage,
    getPreviousPage
  }
}