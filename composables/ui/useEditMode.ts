import { ref, computed, readonly } from 'vue'
import type { UseEditMode } from '../core/interfaces'
import { useComposableContext } from '../core/ComposableContext'
import { useWidgetEventBus } from '../events/useWidgetEventBus'

export function useEditMode(): UseEditMode {
  const context = useComposableContext()
  const eventBus = useWidgetEventBus()
  const isEditMode = ref(false)
  const permissions = ref({
    canEdit: true,
    canDelete: true,
    canCreate: true,
    canMove: true,
    canResize: true
  })

  const canEdit = computed(() => permissions.value.canEdit)

  async function enableEditMode(): Promise<void> {
    if (!canEdit.value) {
      console.warn('Edit mode is not allowed')
      return
    }

    isEditMode.value = true
    context.events.emit('edit-mode:enabled')
    
    // Emit global event
    await eventBus.emit('editMode:changed', true)
    
    // Add global CSS class for edit mode styling
    if (typeof document !== 'undefined') {
      document.body.classList.add('edit-mode')
    }
  }

  async function disableEditMode(): Promise<void> {
    isEditMode.value = false
    context.events.emit('edit-mode:disabled')
    
    // Emit global event
    await eventBus.emit('editMode:changed', false)
    
    // Remove global CSS class
    if (typeof document !== 'undefined') {
      document.body.classList.remove('edit-mode')
    }
  }

  async function toggleEditMode(): Promise<void> {
    if (isEditMode.value) {
      await disableEditMode()
    } else {
      await enableEditMode()
    }
  }

  // Permission management
  function setPermission(permission: keyof typeof permissions.value, value: boolean): void {
    permissions.value[permission] = value
  }

  function hasPermission(permission: keyof typeof permissions.value): boolean {
    return permissions.value[permission]
  }

  // Keyboard shortcuts
  function setupKeyboardShortcuts(): void {
    if (typeof document === 'undefined') return

    function handleKeydown(event: KeyboardEvent): void {
      // Toggle edit mode with Ctrl/Cmd + E
      if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
        event.preventDefault()
        toggleEditMode()
      }
      
      // Exit edit mode with Escape
      if (event.key === 'Escape' && isEditMode.value) {
        event.preventDefault()
        disableEditMode()
      }
    }

    document.addEventListener('keydown', handleKeydown)
    
    // Return cleanup function
    return () => {
      document.removeEventListener('keydown', handleKeydown)
    }
  }

  // Auto-disable edit mode when clicking outside widgets
  function setupClickOutside(): void {
    if (typeof document === 'undefined') return

    function handleClick(event: MouseEvent): void {
      if (!isEditMode.value) return

      const target = event.target as Element
      const isWidgetClick = target.closest('.widget-container') !== null
      const isUIClick = target.closest('.edit-ui') !== null

      if (!isWidgetClick && !isUIClick) {
        // Optional: auto-disable edit mode when clicking outside
        // Uncomment if desired behavior
        // disableEditMode()
      }
    }

    document.addEventListener('click', handleClick)
    
    return () => {
      document.removeEventListener('click', handleClick)
    }
  }

  // Subscribe to external edit mode changes
  context.events.on('edit-mode:force-disable', () => {
    disableEditMode()
  })

  context.events.on('permissions:updated', (newPermissions: typeof permissions.value) => {
    permissions.value = { ...permissions.value, ...newPermissions }
    
    // Disable edit mode if permissions revoked
    if (!permissions.value.canEdit && isEditMode.value) {
      disableEditMode()
    }
  })

  return {
    isEditMode: readonly(isEditMode),
    canEdit,
    enableEditMode,
    disableEditMode,
    toggleEditMode,
    setPermission,
    hasPermission,
    setupKeyboardShortcuts,
    setupClickOutside
  }
}