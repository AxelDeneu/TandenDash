import type { 
  IWidgetInstanceManager, 
  IWidgetPluginRegistry,
  IWidgetFactory,
  IWidgetErrorBoundary,
  WidgetInstanceState,
  IWidgetRenderer,
  IWidgetConfigManager,
  IWidgetDataProvider
} from './interfaces'
import { nanoid } from 'nanoid'

export class WidgetInstanceManager implements IWidgetInstanceManager {
  private instances = new Map<string, WidgetInstanceState>()
  private renderers = new Map<string, IWidgetRenderer>()
  private configManagers = new Map<string, IWidgetConfigManager>()
  private dataProviders = new Map<string, IWidgetDataProvider>()

  constructor(
    private readonly registry: IWidgetPluginRegistry,
    private readonly factory: IWidgetFactory,
    private readonly errorBoundary: IWidgetErrorBoundary
  ) {}

  async createInstance(
    pluginId: string,
    config: unknown,
    position?: { x: number; y: number; width: number; height: number }
  ): Promise<string> {
    try {
      const plugin = this.registry.getPlugin(pluginId)
      if (!plugin) {
        throw new Error(`Plugin "${pluginId}" is not registered`)
      }

      const instanceId = nanoid()
      
      // Create instance state
      const instanceState: WidgetInstanceState = {
        id: instanceId,
        pluginId,
        isLoading: true,
        hasError: false,
        isVisible: true,
        isFocused: false,
        lastUpdated: new Date()
      }

      this.instances.set(instanceId, instanceState)

      try {
        // Create config manager
        const configManager = this.factory.createConfigManager(plugin, config)
        this.configManagers.set(instanceId, configManager)

        // Validate and get final config
        const validatedConfig = configManager.getConfig()

        // Create renderer
        const renderer = this.factory.createRenderer(plugin, validatedConfig)
        this.renderers.set(instanceId, renderer)

        // Create data provider if needed
        const dataProvider = this.factory.createDataProvider(plugin, validatedConfig)
        if (dataProvider) {
          this.dataProviders.set(instanceId, dataProvider)
          
          // Subscribe to data updates
          if (dataProvider.subscribe) {
            dataProvider.subscribe((data) => {
              this.updateInstanceData(instanceId, data)
            })
          }

          // Initial data fetch
          try {
            const initialData = await dataProvider.fetch()
            this.updateInstanceData(instanceId, initialData)
          } catch (error) {
            console.warn(`Failed to fetch initial data for widget "${instanceId}":`, error)
          }
        }

        // Execute lifecycle hook
        if (plugin.lifecycle?.onMount) {
          await plugin.lifecycle.onMount()
        }

        // Update instance state
        this.updateInstanceState(instanceId, {
          isLoading: false,
          lastUpdated: new Date()
        })

        console.log(`Widget instance "${instanceId}" created successfully`)
        return instanceId

      } catch (error) {
        // Handle creation error
        this.handleInstanceError(instanceId, error as Error)
        throw error
      }

    } catch (error) {
      console.error(`Failed to create widget instance for plugin "${pluginId}":`, error)
      throw error
    }
  }

  async destroyInstance(instanceId: string): Promise<void> {
    const instance = this.instances.get(instanceId)
    if (!instance) {
      throw new Error(`Widget instance "${instanceId}" does not exist`)
    }

    try {
      const plugin = this.registry.getPlugin(instance.pluginId)
      
      // Execute lifecycle hook
      if (plugin?.lifecycle?.onUnmount) {
        await plugin.lifecycle.onUnmount()
      }

      // Cleanup renderer
      const renderer = this.renderers.get(instanceId)
      if (renderer) {
        renderer.unmount()
        this.renderers.delete(instanceId)
      }

      // Cleanup data provider
      const dataProvider = this.dataProviders.get(instanceId)
      if (dataProvider && 'cleanup' in dataProvider && typeof dataProvider.cleanup === 'function') {
        await (dataProvider as any).cleanup()
      }
      this.dataProviders.delete(instanceId)

      // Cleanup config manager
      this.configManagers.delete(instanceId)

      // Remove instance
      this.instances.delete(instanceId)

      console.log(`Widget instance "${instanceId}" destroyed successfully`)

    } catch (error) {
      console.error(`Failed to destroy widget instance "${instanceId}":`, error)
      throw error
    }
  }

  async updateInstance(instanceId: string, config: unknown): Promise<void> {
    const instance = this.instances.get(instanceId)
    if (!instance) {
      throw new Error(`Widget instance "${instanceId}" does not exist`)
    }

    try {
      const plugin = this.registry.getPlugin(instance.pluginId)
      if (!plugin) {
        throw new Error(`Plugin "${instance.pluginId}" is no longer registered`)
      }

      const configManager = this.configManagers.get(instanceId)
      if (!configManager) {
        throw new Error(`Config manager not found for instance "${instanceId}"`)
      }

      // Update configuration
      configManager.updateConfig(config)
      const validatedConfig = configManager.getConfig()

      // Update renderer
      const renderer = this.renderers.get(instanceId)
      if (renderer) {
        renderer.update(validatedConfig)
      }

      // Execute lifecycle hook
      if (plugin.lifecycle?.onConfigChange) {
        await plugin.lifecycle.onConfigChange(validatedConfig)
      }

      // Update instance state
      this.updateInstanceState(instanceId, {
        lastUpdated: new Date()
      })

      console.log(`Widget instance "${instanceId}" updated successfully`)

    } catch (error) {
      this.handleInstanceError(instanceId, error as Error)
      throw error
    }
  }

  getInstance(instanceId: string): WidgetInstanceState | undefined {
    return this.instances.get(instanceId)
  }

  getAllInstances(): WidgetInstanceState[] {
    return Array.from(this.instances.values())
  }

  getInstancesByPlugin(pluginId: string): WidgetInstanceState[] {
    return this.getAllInstances().filter(instance => instance.pluginId === pluginId)
  }

  // Helper methods
  private updateInstanceState(instanceId: string, updates: Partial<WidgetInstanceState>): void {
    const instance = this.instances.get(instanceId)
    if (instance) {
      Object.assign(instance, updates)
    }
  }

  private updateInstanceData(instanceId: string, data: unknown): void {
    this.updateInstanceState(instanceId, {
      data,
      lastUpdated: new Date()
    })
  }

  private handleInstanceError(instanceId: string, error: Error): void {
    this.updateInstanceState(instanceId, {
      hasError: true,
      error,
      isLoading: false
    })
    this.errorBoundary.handleError(error, instanceId)
  }

  // Additional utility methods
  getRenderer(instanceId: string): IWidgetRenderer | undefined {
    return this.renderers.get(instanceId)
  }

  getConfigManager(instanceId: string): IWidgetConfigManager | undefined {
    return this.configManagers.get(instanceId)
  }

  getDataProvider(instanceId: string): IWidgetDataProvider | undefined {
    return this.dataProviders.get(instanceId)
  }

  async refreshInstanceData(instanceId: string): Promise<void> {
    const dataProvider = this.dataProviders.get(instanceId)
    if (dataProvider) {
      try {
        const data = await dataProvider.refresh()
        this.updateInstanceData(instanceId, data)
      } catch (error) {
        this.handleInstanceError(instanceId, error as Error)
      }
    }
  }

  setInstanceVisibility(instanceId: string, visible: boolean): void {
    this.updateInstanceState(instanceId, { isVisible: visible })
  }

  setInstanceFocus(instanceId: string, focused: boolean): void {
    this.updateInstanceState(instanceId, { isFocused: focused })
  }
}