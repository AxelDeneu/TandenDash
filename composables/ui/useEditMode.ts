import { ref, computed, readonly, type Ref, type ComputedRef } from 'vue'
import { useComposableContext } from '../core/ComposableContext'
import { useWidgetEventBus } from '../events/useWidgetEventBus'

export interface UseEditMode {
  isEditMode: Ref<boolean>
  canEdit: ComputedRef<boolean>
  
  enableEditMode(): void
  disableEditMode(): void
  toggleEditMode(): void
}

export function useEditMode(): UseEditMode {
  const context = useComposableContext()
  const eventBus = useWidgetEventBus()
  const isEditMode = ref(false)

  const canEdit = computed(() => true)

  function enableEditMode(): void {

    isEditMode.value = true
    context.events.emit('edit-mode:enabled')
    
    // Emit global event
    eventBus.emit('editMode:changed', true)
    
    // Add global CSS class for edit mode styling
    if (typeof document !== 'undefined') {
      document.body.classList.add('edit-mode')
    }
  }

  function disableEditMode(): void {
    isEditMode.value = false
    context.events.emit('edit-mode:disabled')
    
    // Emit global event
    eventBus.emit('editMode:changed', false)
    
    // Remove global CSS class
    if (typeof document !== 'undefined') {
      document.body.classList.remove('edit-mode')
    }
  }

  function toggleEditMode(): void {
    if (isEditMode.value) {
      disableEditMode()
    } else {
      enableEditMode()
    }
  }

  return {
    isEditMode: readonly(isEditMode),
    canEdit,
    enableEditMode,
    disableEditMode,
    toggleEditMode
  }
}