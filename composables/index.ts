// Core composables
export { useComposableContext, provideComposableContext, initializeComposableContext } from './core/ComposableContext'
export { useErrorHandler } from './core/useErrorHandler'
export { useLoadingState } from './core/useLoadingState'
export { useDialogState } from './core/useDialogState'
export { useUIState } from './core/useUIState'
export { createEventEmitter } from './core/EventEmitter'
export { useLogger } from './core/useLogger'

// Data operation composables
export { useWidgetOperations } from './data/useWidgetOperations'
export { usePageOperations } from './data/usePageOperations'

// UI composables
export { useEditMode } from './ui/useEditMode'
export { useWidgetUI } from './ui/useWidgetUI'
export { usePageUI } from './ui/usePageUI'
export { useToolbarVisibility } from './ui/useToolbarVisibility'

// Interaction composables

// Widget composables
export { useWidgetRegistry } from './widgets/useWidgetRegistry'
export { useWidgetPlugins } from './widgets/useWidgetPlugins'

// Backward compatibility exports - will re-export from new locations
export { usePages } from './usePages'
export { useSwipeGesture } from './useSwipeGesture'
export { useWidgetSystem } from './useWidgetSystem'

// Types
export type * from './core/interfaces'
export type { SwipeOptions } from './useSwipeGesture'
export type { WidgetDefinitionCompat } from './widgets/useWidgetRegistry'
export type { UseWidgetPlugins } from './widgets/useWidgetPlugins'