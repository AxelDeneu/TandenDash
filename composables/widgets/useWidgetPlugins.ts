import { ref, computed, readonly, onMounted, type Ref, type ComputedRef } from 'vue'
import { widgetSystem } from '@/lib/widgets/WidgetSystem'
import type { WidgetPluginManifest, IWidgetPlugin } from '@/lib/widgets/interfaces'
import { useComposableContext } from '../core/ComposableContext'
import { useLoadingState } from '../core/useLoadingState'
import { useErrorHandler } from '../core/useErrorHandler'

// Singleton initialization state
const systemInitialized = ref(false)
const initializationPromise = ref<Promise<boolean> | null>(null)

export interface UseWidgetPlugins {
  loading: ComputedRef<boolean>
  error: ComputedRef<Error | null>
  isInitialized: Readonly<Ref<boolean>>
  systemInfo: ComputedRef<{
    initialized: boolean
    hotReloadEnabled: boolean
    pluginCount: number
    instanceCount: number
    errorCount: number
  }>
  initialize(): Promise<boolean>
  getPlugin(widgetId: string): IWidgetPlugin | null
  getAllPlugins(): IWidgetPlugin[]
  registerPlugin(manifest: WidgetPluginManifest<any>): Promise<boolean>
  createInstance(widgetId: string, containerId: string, config?: Record<string, any>): Promise<string>
  destroyInstance(instanceId: string): Promise<void>
  validatePlugin(widgetId: string, config?: Record<string, any>): Promise<boolean>
}

export function useWidgetPlugins(): UseWidgetPlugins {
  const context = useComposableContext()
  const loadingState = useLoadingState()
  const errorHandler = useErrorHandler()

  const loading = computed(() => loadingState.isLoading.value)
  const error = computed(() => errorHandler.error.value)

  /**
   * Initialize the widget system (singleton pattern)
   */
  async function initialize(): Promise<boolean> {
    // Return cached result if already initialized
    if (systemInitialized.value) {
      return true
    }

    // Return existing promise if initialization is in progress
    if (initializationPromise.value) {
      return initializationPromise.value
    }

    // Create new initialization promise
    initializationPromise.value = performInitialization()
    
    try {
      const result = await initializationPromise.value
      return result
    } finally {
      initializationPromise.value = null
    }
  }

  async function performInitialization(): Promise<boolean> {
    const operation = async () => {
      await widgetSystem.initialize()
      systemInitialized.value = true
      context.events.emit('widgets:system-initialized')
      return true
    }

    errorHandler.clearError()

    try {
      return await loadingState.withLoading(operation, 'widget-init')
    } catch (err) {
      const error = err as Error
      errorHandler.handleError(error)
      context.events.emit('widgets:initialization-failed', error)
      return false
    }
  }

  function getPlugin(widgetId: string): IWidgetPlugin | null {
    if (!systemInitialized.value) {
      console.warn('Widget system not initialized')
      return null
    }

    return widgetSystem.registry.getPlugin(widgetId)
  }

  function getAllPlugins(): IWidgetPlugin[] {
    if (!systemInitialized.value) {
      console.warn('Widget system not initialized')
      return []
    }

    return widgetSystem.registry.getAllPlugins()
  }

  async function registerPlugin(manifest: WidgetPluginManifest<any>): Promise<boolean> {
    await initialize()

    const operation = async () => {
      await widgetSystem.registry.registerPlugin(manifest)
      context.events.emit('widgets:plugin-registered', manifest.metadata.id)
      return true
    }

    errorHandler.clearError()

    try {
      return await loadingState.withLoading(operation, 'widget-register')
    } catch (err) {
      const error = err as Error
      errorHandler.handleError(error)
      context.events.emit('widgets:registration-failed', manifest.metadata.id, error)
      return false
    }
  }

  async function createInstance(
    widgetId: string,
    containerId: string,
    config?: Record<string, any>
  ): Promise<string> {
    await initialize()

    const operation = async () => {
      const instanceId = await widgetSystem.instanceManager.createInstance(
        widgetId,
        containerId,
        config
      )
      context.events.emit('widgets:instance-created', instanceId, widgetId)
      return instanceId
    }

    errorHandler.clearError()

    try {
      return await loadingState.withLoading(operation, 'widget-create')
    } catch (err) {
      const error = err as Error
      errorHandler.handleError(error)
      context.events.emit('widgets:instance-creation-failed', widgetId, error)
      throw error
    }
  }

  async function destroyInstance(instanceId: string): Promise<void> {
    if (!systemInitialized.value) {
      console.warn('Widget system not initialized')
      return
    }

    const operation = async () => {
      await widgetSystem.instanceManager.destroyInstance(instanceId)
      context.events.emit('widgets:instance-destroyed', instanceId)
    }

    errorHandler.clearError()

    try {
      await loadingState.withLoading(operation, 'widget-destroy')
    } catch (err) {
      const error = err as Error
      errorHandler.handleError(error)
      context.events.emit('widgets:instance-destruction-failed', instanceId, error)
      throw error
    }
  }

  async function validatePlugin(widgetId: string, config?: Record<string, any>): Promise<boolean> {
    const plugin = getPlugin(widgetId)
    if (!plugin) {
      return false
    }

    try {
      // Validate config against schema if provided
      if (plugin.configSchema && config) {
        // Here you would implement schema validation
        // For now, we'll do basic validation
        return true
      }
      return true
    } catch (err) {
      context.events.emit('widgets:validation-failed', widgetId, err)
      return false
    }
  }

  const systemInfo = computed(() => {
    if (!systemInitialized.value) {
      return {
        initialized: false,
        hotReloadEnabled: false,
        pluginCount: 0,
        instanceCount: 0,
        errorCount: 0
      }
    }

    return widgetSystem.getSystemInfo()
  })

  // Auto-initialize on first use
  if (typeof window !== 'undefined') {
    onMounted(async () => {
      await initialize()
    })
  }

  return {
    loading,
    error,
    isInitialized: readonly(systemInitialized),
    systemInfo,
    initialize,
    getPlugin,
    getAllPlugins,
    registerPlugin,
    createInstance,
    destroyInstance,
    validatePlugin
  }
}