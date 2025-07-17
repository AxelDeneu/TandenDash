// Core composables
export { useComposableContext, provideComposableContext, initializeComposableContext } from './core/ComposableContext'
export { useErrorHandler } from './core/useErrorHandler'
export { useLoadingState } from './core/useLoadingState'
export { createEventEmitter } from './core/EventEmitter'
export { useLogger } from './core/useLogger'

// Data operation composables
export { useWidgetOperations } from './data/useWidgetOperations'
export { usePageOperations } from './data/usePageOperations'
export { useWidgetLoader } from './data/useWidgetLoader'

// UI composables
export { useEditMode } from './ui/useEditMode'
export { useWidgetUI } from './ui/useWidgetUI'
export { usePageUI } from './ui/usePageUI'
export { useFloatingDock } from './ui/useFloatingDock'
export { useCarouselNavigation } from './ui/useCarouselNavigation'
export { useDarkMode } from './ui/useDarkMode'

// Interaction composables
export { useSwipeGesture } from './interaction/useSwipeGesture'
export { useDragAndDrop } from './interaction/useDragAndDrop'

// Widget composables
export { useWidgetPlugins } from './widgets/useWidgetPlugins'

// Event composables
export { useWidgetEventBus } from './events/useWidgetEventBus'


// Types
export type * from './core/interfaces'
export type { SwipeOptions } from './interaction/useSwipeGesture'
export type { UseDragAndDrop } from './interaction/useDragAndDrop'
export type { UseWidgetPlugins } from './widgets/useWidgetPlugins'
export type { UseFloatingDock, DockPosition } from './ui/useFloatingDock'
export type { UseCarouselNavigation } from './ui/useCarouselNavigation'
export type { UseWidgetLoader } from './data/useWidgetLoader'