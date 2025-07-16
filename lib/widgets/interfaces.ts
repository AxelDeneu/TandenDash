import type { Component } from 'vue'
import type { ZodSchema } from 'zod'
import type { BaseWidgetConfig } from '@/types/widget'

// Core widget plugin interface
export interface IWidgetPlugin<TConfig extends BaseWidgetConfig = BaseWidgetConfig> {
  id: string
  name: string
  description: string
  version: string
  icon?: string
  category: string
  tags: string[]
  component: Component
  defaultConfig: TConfig
  configSchema: ZodSchema<TConfig>
  dataProvider?: new () => IWidgetDataProvider
  permissions?: string[]
  settings?: IWidgetSettings
}

// Widget settings
export interface IWidgetSettings {
  allowResize: boolean
  allowMove: boolean
  allowDelete: boolean
  allowConfigure: boolean
}

// Data provider interface
export interface IWidgetDataProvider<TData = any> {
  fetch(): Promise<TData>
  refresh(): Promise<TData>
  subscribe?(callback: (data: TData) => void): void
  unsubscribe?(): void
}

// Widget instance interface
export interface IWidgetInstance {
  id: string
  pluginId: string
  config: BaseWidgetConfig
  isLoading: boolean
  hasError: boolean
  error?: Error
  data?: any
  lastUpdated: Date
}

// Main widget core interface
export interface IWidgetCore {
  // System methods
  initialize(): Promise<void>
  shutdown(): Promise<void>
  getSystemInfo(): {
    initialized: boolean
    pluginCount: number
    instanceCount: number
    errorCount: number
  }
  performHealthCheck(): Promise<{
    healthy: boolean
    issues: string[]
    recommendations: string[]
  }>

  // Plugin registry methods
  register(plugin: IWidgetPlugin): void
  unregister(pluginId: string): void
  getPlugin(pluginId: string): IWidgetPlugin | undefined
  getAllPlugins(): IWidgetPlugin[]
  getPluginsByCategory(category: string): IWidgetPlugin[]
  searchPlugins(query: string): IWidgetPlugin[]

  // Instance management methods
  createInstance(pluginId: string, config: unknown): Promise<string>
  destroyInstance(instanceId: string): Promise<void>
  updateInstance(instanceId: string, config: unknown): Promise<void>
  getInstance(instanceId: string): IWidgetInstance | undefined
  getAllInstances(): IWidgetInstance[]
  getInstancesByPlugin(pluginId: string): IWidgetInstance[]
}