import type { Component } from 'vue'
import type { BaseWidgetConfig } from '@/types/widget'
import type { WidgetPlugin } from './WidgetCore'

export class WidgetRenderer<TConfig extends BaseWidgetConfig> {
  public readonly component: Component
  public props: TConfig
  private mountedElement?: HTMLElement

  constructor(
    private readonly plugin: WidgetPlugin<TConfig>,
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
  }

  unmount(): void {
    if (!this.mountedElement) {
      return
    }

    this.mountedElement = undefined
  }

  update(newProps: TConfig): void {
    this.props = newProps
  }

  // Additional methods
  isMounted(): boolean {
    return !!this.mountedElement
  }

  getMountedElement(): HTMLElement | undefined {
    return this.mountedElement
  }

  getPluginId(): string {
    return this.plugin.id
  }

  handleResize(width: number, height: number): void {
    // Hook for future implementation if needed
  }

  handleError(error: Error): void {
    // Hook for future implementation if needed
  }
}