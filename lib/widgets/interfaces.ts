import type { Component } from 'vue'
import type { ZodSchema } from 'zod'
import type { BaseWidgetConfig } from '@/types/widget'

// Widget lifecycle hooks
export interface WidgetLifecycle {
  onMount?: () => void | Promise<void>
  onUnmount?: () => void | Promise<void>
  onUpdate?: (newConfig: unknown) => void | Promise<void>
  onResize?: (width: number, height: number) => void | Promise<void>
  onConfigChange?: (newConfig: unknown) => void | Promise<void>
  onError?: (error: Error) => void | Promise<void>
}

// Widget data provider interface
export interface IWidgetDataProvider<TData = unknown> {
  fetch(): Promise<TData>
  refresh(): Promise<TData>
  subscribe?(callback: (data: TData) => void): () => void
  validate?(data: TData): boolean
}

// Widget configuration manager interface
export interface IWidgetConfigManager<TConfig extends BaseWidgetConfig = BaseWidgetConfig> {
  getConfig(): TConfig
  updateConfig(config: Partial<TConfig>): void
  validateConfig(config: unknown): TConfig
  getSchema(): ZodSchema<TConfig>
  getDefaults(): TConfig
}

// Widget renderer interface
export interface IWidgetRenderer<TConfig extends BaseWidgetConfig = BaseWidgetConfig> {
  component: Component
  props: TConfig
  mount(element: HTMLElement): void
  unmount(): void
  update(newProps: TConfig): void
}

// Widget plugin metadata
export interface WidgetPluginMetadata {
  id: string
  name: string
  description: string
  version: string
  author: string
  category: string
  tags: string[]
  icon?: string
  preview?: string
  dependencies?: string[]
  minDashboardVersion?: string
}

// Widget plugin manifest
export interface WidgetPluginManifest<TConfig extends BaseWidgetConfig = BaseWidgetConfig> {
  metadata: WidgetPluginMetadata
  configSchema: ZodSchema<TConfig>
  defaultConfig: TConfig
  component: Component
  dataProvider?: new () => IWidgetDataProvider
  lifecycle?: WidgetLifecycle
  permissions?: string[]
  settings?: {
    allowResize: boolean
    allowMove: boolean
    allowDelete: boolean
    allowConfigure: boolean
  }
}

// Widget instance state
export interface WidgetInstanceState {
  id: string
  pluginId: string
  isLoading: boolean
  hasError: boolean
  error?: Error
  data?: unknown
  lastUpdated?: Date
  isVisible: boolean
  isFocused: boolean
}

// Widget plugin interface (simplified version for compatibility)
export interface IWidgetPlugin {
  metadata: WidgetPluginMetadata
  component: Component
  defaultConfig: BaseWidgetConfig
  configSchema?: ZodSchema<BaseWidgetConfig>
}

// Widget plugin registry interface
export interface IWidgetPluginRegistry {
  register<TConfig extends BaseWidgetConfig>(
    plugin: WidgetPluginManifest<TConfig>
  ): void
  unregister(pluginId: string): void
  getPlugin<TConfig extends BaseWidgetConfig = BaseWidgetConfig>(
    pluginId: string
  ): WidgetPluginManifest<TConfig> | undefined
  getAllPlugins(): WidgetPluginManifest[]
  getPluginsByCategory(category: string): WidgetPluginManifest[]
  isRegistered(pluginId: string): boolean
  validatePlugin<TConfig extends BaseWidgetConfig>(
    plugin: WidgetPluginManifest<TConfig>
  ): boolean
}

// Widget instance manager interface
export interface IWidgetInstanceManager {
  createInstance(
    pluginId: string,
    config: unknown,
    position?: { x: number; y: number; width: number; height: number }
  ): Promise<string>
  destroyInstance(instanceId: string): Promise<void>
  updateInstance(instanceId: string, config: unknown): Promise<void>
  getInstance(instanceId: string): WidgetInstanceState | undefined
  getAllInstances(): WidgetInstanceState[]
  getInstancesByPlugin(pluginId: string): WidgetInstanceState[]
}

// Widget error boundary interface
export interface IWidgetErrorBoundary {
  handleError(error: Error, instanceId: string): void
  recoverInstance(instanceId: string): Promise<boolean>
  getErrorInfo(instanceId: string): {
    error: Error
    timestamp: Date
    recoveryAttempts: number
  } | undefined
}

// Widget plugin loader interface
export interface IWidgetPluginLoader {
  loadPlugin(pluginPath: string): Promise<WidgetPluginManifest>
  unloadPlugin(pluginId: string): Promise<void>
  hotReload(pluginId: string): Promise<void>
  getLoadedPlugins(): string[]
  validatePluginStructure(pluginPath: string): Promise<boolean>
}

// Widget factory interface
export interface IWidgetFactory {
  createRenderer<TConfig extends BaseWidgetConfig>(
    plugin: WidgetPluginManifest<TConfig>,
    config: TConfig
  ): IWidgetRenderer<TConfig>
  createConfigManager<TConfig extends BaseWidgetConfig>(
    plugin: WidgetPluginManifest<TConfig>,
    initialConfig?: Partial<TConfig>
  ): IWidgetConfigManager<TConfig>
  createDataProvider<TData>(
    plugin: WidgetPluginManifest,
    config: unknown
  ): IWidgetDataProvider<TData> | undefined
}

// Main widget system interface
export interface IWidgetSystem {
  readonly registry: IWidgetPluginRegistry
  readonly instanceManager: IWidgetInstanceManager
  readonly factory: IWidgetFactory
  readonly errorBoundary: IWidgetErrorBoundary
  readonly loader: IWidgetPluginLoader

  initialize(): Promise<void>
  shutdown(): Promise<void>
  installPlugin(pluginPath: string): Promise<void>
  uninstallPlugin(pluginId: string): Promise<void>
  enableHotReload(): void
  disableHotReload(): void
}