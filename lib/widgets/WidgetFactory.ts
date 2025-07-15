import type { 
  IWidgetFactory,
  IWidgetRenderer,
  IWidgetConfigManager,
  IWidgetDataProvider,
  WidgetPluginManifest
} from './interfaces'
import type { BaseWidgetConfig } from '@/types/widget'
import { WidgetRenderer } from './WidgetRenderer'
import { WidgetConfigManager } from './WidgetConfigManager'

export class WidgetFactory implements IWidgetFactory {
  createRenderer<TConfig extends BaseWidgetConfig>(
    plugin: WidgetPluginManifest<TConfig>,
    config: TConfig
  ): IWidgetRenderer<TConfig> {
    return new WidgetRenderer(plugin, config)
  }

  createConfigManager<TConfig extends BaseWidgetConfig>(
    plugin: WidgetPluginManifest<TConfig>,
    initialConfig?: Partial<TConfig>
  ): IWidgetConfigManager<TConfig> {
    return new WidgetConfigManager(plugin, initialConfig)
  }

  createDataProvider<TData>(
    plugin: WidgetPluginManifest,
    config: unknown
  ): IWidgetDataProvider<TData> | undefined {
    if (!plugin.dataProvider) {
      return undefined
    }

    try {
      return new plugin.dataProvider() as IWidgetDataProvider<TData>
    } catch (error) {
      console.error(`Failed to create data provider for plugin "${plugin.metadata.id}":`, error)
      return undefined
    }
  }
}