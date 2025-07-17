import { ref, computed, readonly, onMounted, type Ref, type ComputedRef } from 'vue'
import { widgetCore, type WidgetPlugin } from '@/lib/widgets'
import { useComposableContext } from '../core/ComposableContext'
import { useLoadingState } from '../core/useLoadingState'
import { useErrorHandler } from '../core/useErrorHandler'
import { useLogger } from '../core/useLogger'

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
  getPlugin(widgetId: string): WidgetPlugin | null
  getAllPlugins(): WidgetPlugin[]
  registerPlugin(plugin: WidgetPlugin): Promise<boolean>
  createInstance(widgetId: string, containerId: string, config?: Record<string, any>): Promise<string>
  destroyInstance(instanceId: string): Promise<void>
  validatePlugin(widgetId: string, config?: Record<string, any>): Promise<boolean>
}

export function useWidgetPlugins(): UseWidgetPlugins {
  const context = useComposableContext()
  const loadingState = useLoadingState()
  const errorHandler = useErrorHandler()
  const logger = useLogger({ module: 'useWidgetPlugins' })

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
      await widgetCore.initialize()
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

  function getPlugin(widgetId: string): WidgetPlugin | null {
    if (!systemInitialized.value) {
      // Only log warning if we're not in the middle of initialization
      if (!initializationPromise.value) {
        logger.warn('Widget system not initialized')
      }
      return null
    }

    return widgetCore.getPlugin(widgetId) as any
  }

  function getAllPlugins(): WidgetPlugin[] {
    if (!systemInitialized.value) {
      // Only log warning if we're not in the middle of initialization
      if (!initializationPromise.value) {
        logger.warn('Widget system not initialized')
      }
      return []
    }

    return widgetCore.getAllPlugins() as any[]
  }

  async function registerPlugin(plugin: WidgetPlugin): Promise<boolean> {
    await initialize()

    const operation = async () => {
      await widgetCore.register(plugin)
      context.events.emit('widgets:plugin-registered', plugin.id)
      return true
    }

    errorHandler.clearError()

    try {
      return await loadingState.withLoading(operation, 'widget-register')
    } catch (err) {
      const error = err as Error
      errorHandler.handleError(error)
      context.events.emit('widgets:registration-failed', plugin.id, error)
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
      const instanceId = await widgetCore.createInstance(
        widgetId,
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
      logger.warn('Widget system not initialized')
      return
    }

    const operation = async () => {
      await widgetCore.destroyInstance(instanceId)
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

    return widgetCore.getSystemInfo()
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