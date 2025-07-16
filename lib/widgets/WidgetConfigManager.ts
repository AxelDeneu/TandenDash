import type { BaseWidgetConfig } from '@/types/widget'
import type { WidgetPlugin } from './WidgetCore'

export class WidgetConfigManager<TConfig extends BaseWidgetConfig> {
  private config: TConfig

  constructor(
    private readonly plugin: WidgetPlugin<TConfig>,
    initialConfig?: Partial<TConfig>
  ) {
    // Merge initial config with defaults
    this.config = {
      ...plugin.defaultConfig,
      ...initialConfig
    } as TConfig

    // Validate the merged config
    this.validateConfig(this.config)
  }

  getConfig(): TConfig {
    return { ...this.config }
  }

  updateConfig(newConfig: Partial<TConfig>): void {
    const updatedConfig = {
      ...this.config,
      ...newConfig
    } as TConfig

    // Validate before updating
    this.validateConfig(updatedConfig)
    this.config = updatedConfig
  }

  validateConfig(config: unknown): TConfig {
    try {
      return this.plugin.configSchema.parse(config)
    } catch (error) {
      throw new Error(`Widget config validation failed for plugin "${this.plugin.metadata.id}": ${error}`)
    }
  }

  getSchema(): ZodSchema<TConfig> {
    return this.plugin.configSchema
  }

  getDefaults(): TConfig {
    return { ...this.plugin.defaultConfig }
  }

  // Additional utility methods
  resetToDefaults(): void {
    this.config = { ...this.plugin.defaultConfig }
  }

  hasProperty(key: keyof TConfig): boolean {
    return key in this.config
  }

  getProperty<K extends keyof TConfig>(key: K): TConfig[K] {
    return this.config[key]
  }

  setProperty<K extends keyof TConfig>(key: K, value: TConfig[K]): void {
    const updatedConfig = {
      ...this.config,
      [key]: value
    } as TConfig

    this.validateConfig(updatedConfig)
    this.config = updatedConfig
  }

  toJSON(): string {
    return JSON.stringify(this.config)
  }

  fromJSON(json: string): void {
    try {
      const parsed = JSON.parse(json)
      this.validateConfig(parsed)
      this.config = parsed
    } catch (error) {
      throw new Error(`Failed to load config from JSON: ${error}`)
    }
  }

  diff(otherConfig: TConfig): Partial<TConfig> {
    const differences: Partial<TConfig> = {}
    
    for (const key in this.config) {
      if (this.config[key] !== otherConfig[key]) {
        differences[key] = otherConfig[key]
      }
    }

    return differences
  }
}