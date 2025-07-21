import { ref, computed, readonly } from 'vue'
import { useRouter } from '#app'
import type { Dashboard, DashboardWithRelations, CreateDashboardRequest, UpdateDashboardRequest } from '@/types'
import { useAsyncState } from '@vueuse/core'
import { useComposableContext, useLogger } from '@/composables'

export function useDashboard() {
  const context = useComposableContext()
  const router = useRouter()
  const logger = useLogger({ module: 'useDashboard' })

  // State
  const dashboards = ref<Dashboard[]>([])
  const currentDashboard = ref<DashboardWithRelations | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const currentDashboardId = computed(() => currentDashboard.value?.id)
  const isLoading = computed(() => loading.value)
  const hasError = computed(() => !!error.value)
  const dashboardCount = computed(() => dashboards.value.length)

  // Fetch all dashboards
  const fetchDashboards = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch('/api/dashboards')
      dashboards.value = response
      logger.info('Dashboards loaded', { count: response.length })
      return response
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load dashboards'
      error.value = message
      logger.error('Failed to load dashboards', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Fetch single dashboard with relations
  const fetchDashboard = async (id: number) => {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<DashboardWithRelations>(`/api/dashboards/${id}`)
      currentDashboard.value = response
      logger.info('Dashboard loaded', { id, name: response.name })
      return response
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load dashboard'
      error.value = message
      logger.error('Failed to load dashboard', err, { id })
      throw err
    } finally {
      loading.value = false
    }
  }

  // Fetch default dashboard
  const fetchDefaultDashboard = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<Dashboard>('/api/dashboards/default')
      await fetchDashboard(response.id)
      return response
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load default dashboard'
      error.value = message
      logger.error('Failed to load default dashboard', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Create dashboard
  const createDashboard = async (data: CreateDashboardRequest) => {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<Dashboard>('/api/dashboards', {
        method: 'POST',
        body: data
      })
      
      // Refresh dashboard list
      await fetchDashboards()
      
      logger.info('Dashboard created', { id: response.id, name: response.name })
      return response
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create dashboard'
      error.value = message
      logger.error('Failed to create dashboard', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update dashboard
  const updateDashboard = async (id: number, data: Partial<UpdateDashboardRequest>) => {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<Dashboard>(`/api/dashboards/${id}`, {
        method: 'PUT',
        body: data
      })
      
      // Update current dashboard if it's the one being updated
      if (currentDashboard.value?.id === id) {
        currentDashboard.value = {
          ...currentDashboard.value,
          ...response
        }
      }
      
      // Refresh dashboard list
      await fetchDashboards()
      
      logger.info('Dashboard updated', { id, name: response.name })
      return response
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update dashboard'
      error.value = message
      logger.error('Failed to update dashboard', err, { id })
      throw err
    } finally {
      loading.value = false
    }
  }

  // Delete dashboard
  const deleteDashboard = async (id: number) => {
    loading.value = true
    error.value = null

    try {
      await $fetch(`/api/dashboards/${id}`, {
        method: 'DELETE'
      })
      
      // If deleting current dashboard, load default
      if (currentDashboard.value?.id === id) {
        await fetchDefaultDashboard()
      }
      
      // Refresh dashboard list
      await fetchDashboards()
      
      logger.info('Dashboard deleted', { id })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete dashboard'
      error.value = message
      logger.error('Failed to delete dashboard', err, { id })
      throw err
    } finally {
      loading.value = false
    }
  }

  // Switch to dashboard
  const switchDashboard = async (id: number) => {
    loading.value = true
    error.value = null

    try {
      await fetchDashboard(id)
      
      // Navigate to dashboard route
      await router.push(`/dashboard/${id}`)
      
      logger.info('Switched to dashboard', { id })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to switch dashboard'
      error.value = message
      logger.error('Failed to switch dashboard', err, { id })
      throw err
    } finally {
      loading.value = false
    }
  }

  // Set default dashboard
  const setDefaultDashboard = async (id: number) => {
    loading.value = true
    error.value = null

    try {
      await $fetch(`/api/dashboards/${id}/default`, {
        method: 'PUT'
      })
      
      // Refresh dashboard list
      await fetchDashboards()
      
      logger.info('Default dashboard set', { id })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to set default dashboard'
      error.value = message
      logger.error('Failed to set default dashboard', err, { id })
      throw err
    } finally {
      loading.value = false
    }
  }

  // Duplicate dashboard
  const duplicateDashboard = async (id: number, newName: string) => {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<Dashboard>(`/api/dashboards/${id}/duplicate`, {
        method: 'POST',
        body: { name: newName }
      })
      
      // Refresh dashboard list
      await fetchDashboards()
      
      logger.info('Dashboard duplicated', { sourceId: id, newId: response.id, name: newName })
      return response
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to duplicate dashboard'
      error.value = message
      logger.error('Failed to duplicate dashboard', err, { id })
      throw err
    } finally {
      loading.value = false
    }
  }

  // Initialize with async state
  const { execute: initialize } = useAsyncState(
    async () => {
      await fetchDashboards()
      
      // Load default dashboard if no current dashboard
      if (!currentDashboard.value) {
        await fetchDefaultDashboard()
      }
    },
    null,
    {
      immediate: false
    }
  )

  return {
    // State
    dashboards: readonly(dashboards),
    currentDashboard: readonly(currentDashboard),
    currentDashboardId,
    loading: readonly(loading),
    error: readonly(error),
    isLoading,
    hasError,
    dashboardCount,
    
    // Methods
    initialize,
    fetchDashboards,
    fetchDashboard,
    fetchDefaultDashboard,
    createDashboard,
    updateDashboard,
    deleteDashboard,
    switchDashboard,
    setDefaultDashboard,
    duplicateDashboard
  }
}