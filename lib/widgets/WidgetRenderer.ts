import type { Component } from 'vue'
import type { 
  IWidgetRenderer,
  WidgetPluginManifest
} from './interfaces'
import type { BaseWidgetConfig } from '@/types/widget'

export class WidgetRenderer<TConfig extends BaseWidgetConfig> implements IWidgetRenderer<TConfig> {
  public readonly component: Component
  public props: TConfig
  private mountedElement?: HTMLElement

  constructor(
    private readonly plugin: WidgetPluginManifest<TConfig>,
    config: TConfig
  ) {
    this.component = plugin.component
    this.props = config
  }

  mount(element: HTMLElement): void {
    if (this.mountedElement) {
      throw new Error('Widget is already mounted')
    }

    this.mountedElement = element
    
    // Execute lifecycle hook
    if (this.plugin.lifecycle?.onMount) {
      this.plugin.lifecycle.onMount()
    }
  }

  unmount(): void {
    if (!this.mountedElement) {
      return
    }

    // Execute lifecycle hook
    if (this.plugin.lifecycle?.onUnmount) {
      this.plugin.lifecycle.onUnmount()
    }

    this.mountedElement = undefined
  }

  update(newProps: TConfig): void {
    const oldProps = this.props
    this.props = newProps

    // Execute lifecycle hook
    if (this.plugin.lifecycle?.onUpdate) {
      this.plugin.lifecycle.onUpdate(newProps)
    }

    // Check if config changed
    if (JSON.stringify(oldProps) !== JSON.stringify(newProps)) {
      if (this.plugin.lifecycle?.onConfigChange) {
        this.plugin.lifecycle.onConfigChange(newProps)
      }
    }
  }

  // Additional methods
  isMounted(): boolean {
    return !!this.mountedElement
  }

  getMountedElement(): HTMLElement | undefined {
    return this.mountedElement
  }

  getPluginId(): string {
    return this.plugin.metadata.id
  }

  handleResize(width: number, height: number): void {
    if (this.plugin.lifecycle?.onResize) {
      this.plugin.lifecycle.onResize(width, height)
    }
  }

  handleError(error: Error): void {
    if (this.plugin.lifecycle?.onError) {
      this.plugin.lifecycle.onError(error)
    }
  }
}