import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useEditMode } from '@/composables/ui/useEditMode'
import { withSetup, expectReadonlyRef } from '../../helpers/composable-test-utils'

describe('useEditMode Composable', () => {
  let mockBodyClassList: { add: ReturnType<typeof vi.fn>, remove: ReturnType<typeof vi.fn> }
  
  beforeEach(() => {
    vi.clearAllMocks()
    mockBodyClassList = global.mockDocument.body.classList as any
  })

  describe('initialization', () => {
    it('should initialize with edit mode disabled', () => {
      const [editMode] = withSetup(() => useEditMode())

      expect(editMode.isEditMode.value).toBe(false)
      expect(editMode.canEdit.value).toBe(true)
    })

    it('should provide all required methods', () => {
      const [editMode] = withSetup(() => useEditMode())

      expect(typeof editMode.enableEditMode).toBe('function')
      expect(typeof editMode.disableEditMode).toBe('function')
      expect(typeof editMode.toggleEditMode).toBe('function')
    })

    it('should have readonly isEditMode ref', () => {
      const [editMode] = withSetup(() => useEditMode())

      // Should be readonly - cannot directly assign
      expect(expectReadonlyRef(editMode.isEditMode)).toBe(true)
    })
  })

  describe('enableEditMode', () => {
    it('should enable edit mode', () => {
      const [editMode] = withSetup(() => useEditMode())

      editMode.enableEditMode()

      expect(editMode.isEditMode.value).toBe(true)
    })

    it('should add CSS class to document body', () => {
      const [editMode] = withSetup(() => useEditMode())

      editMode.enableEditMode()

      expect(mockBodyClassList.add).toHaveBeenCalledWith('edit-mode')
    })

    it('should work when document is undefined', () => {
      const originalDocument = global.document
      // @ts-ignore
      global.document = undefined

      const [editMode] = withSetup(() => useEditMode())
      
      expect(() => editMode.enableEditMode()).not.toThrow()
      expect(editMode.isEditMode.value).toBe(true)

      global.document = originalDocument
    })
  })

  describe('disableEditMode', () => {
    it('should disable edit mode', () => {
      const [editMode] = withSetup(() => useEditMode())
      editMode.enableEditMode()

      editMode.disableEditMode()

      expect(editMode.isEditMode.value).toBe(false)
    })

    it('should remove CSS class from document body', () => {
      const [editMode] = withSetup(() => useEditMode())
      editMode.enableEditMode()
      vi.clearAllMocks() // Clear the add call

      editMode.disableEditMode()

      expect(mockBodyClassList.remove).toHaveBeenCalledWith('edit-mode')
    })

    it('should work when document is undefined', () => {
      const originalDocument = global.document
      // @ts-ignore
      global.document = undefined

      const [editMode] = withSetup(() => useEditMode())
      editMode.enableEditMode() // This should work
      
      expect(() => editMode.disableEditMode()).not.toThrow()
      expect(editMode.isEditMode.value).toBe(false)

      global.document = originalDocument
    })
  })

  describe('toggleEditMode', () => {
    it('should enable edit mode when disabled', () => {
      const editMode = useEditMode()

      expect(editMode.isEditMode.value).toBe(false)
      editMode.toggleEditMode()

      expect(editMode.isEditMode.value).toBe(true)
      expect(mockBodyClassList.add).toHaveBeenCalledWith('edit-mode')
    })

    it('should disable edit mode when enabled', () => {
      const editMode = useEditMode()
      editMode.enableEditMode()
      vi.clearAllMocks()

      editMode.toggleEditMode()

      expect(editMode.isEditMode.value).toBe(false)
      expect(mockBodyClassList.remove).toHaveBeenCalledWith('edit-mode')
    })

    it('should toggle multiple times correctly', () => {
      const editMode = useEditMode()

      // Start disabled
      expect(editMode.isEditMode.value).toBe(false)

      // Toggle to enabled
      editMode.toggleEditMode()
      expect(editMode.isEditMode.value).toBe(true)

      // Toggle to disabled
      editMode.toggleEditMode()
      expect(editMode.isEditMode.value).toBe(false)

      // Toggle to enabled again
      editMode.toggleEditMode()
      expect(editMode.isEditMode.value).toBe(true)
    })
  })

  describe('canEdit computed property', () => {
    it('should always return true by default', () => {
      const editMode = useEditMode()

      expect(editMode.canEdit.value).toBe(true)

      editMode.enableEditMode()
      expect(editMode.canEdit.value).toBe(true)

      editMode.disableEditMode()
      expect(editMode.canEdit.value).toBe(true)
    })

    it('should be reactive', () => {
      const editMode = useEditMode()
      let canEditValue = editMode.canEdit.value

      expect(canEditValue).toBe(true)

      // canEdit is currently a simple computed that returns true
      // If logic changes in the future, this test would catch it
      editMode.enableEditMode()
      expect(editMode.canEdit.value).toBe(canEditValue)
    })
  })

  describe('state consistency', () => {
    it('should maintain consistent state across operations', () => {
      const editMode = useEditMode()

      // Start in consistent state
      expect(editMode.isEditMode.value).toBe(false)

      // Enable and check state
      editMode.enableEditMode()
      expect(editMode.isEditMode.value).toBe(true)
      expect(mockBodyClassList.add).toHaveBeenCalledWith('edit-mode')

      // Disable and check state
      editMode.disableEditMode()
      expect(editMode.isEditMode.value).toBe(false)
      expect(mockBodyClassList.remove).toHaveBeenCalledWith('edit-mode')
    })

    it('should handle multiple enable calls gracefully', () => {
      const editMode = useEditMode()

      editMode.enableEditMode()
      editMode.enableEditMode()
      editMode.enableEditMode()

      expect(editMode.isEditMode.value).toBe(true)
      expect(mockBodyClassList.add).toHaveBeenCalledTimes(3)
    })

    it('should handle multiple disable calls gracefully', () => {
      const editMode = useEditMode()
      editMode.enableEditMode()
      vi.clearAllMocks()

      editMode.disableEditMode()
      editMode.disableEditMode()
      editMode.disableEditMode()

      expect(editMode.isEditMode.value).toBe(false)
      expect(mockBodyClassList.remove).toHaveBeenCalledTimes(3)
    })
  })

  describe('singleton behavior', () => {
    it('should maintain independent state for multiple instances', () => {
      const editMode1 = useEditMode()
      const editMode2 = useEditMode()

      // Each instance should have its own state
      editMode1.enableEditMode()
      expect(editMode1.isEditMode.value).toBe(true)
      expect(editMode2.isEditMode.value).toBe(false)

      editMode2.enableEditMode()
      expect(editMode2.isEditMode.value).toBe(true)
      expect(editMode1.isEditMode.value).toBe(true)

      editMode1.disableEditMode()
      expect(editMode1.isEditMode.value).toBe(false)
      expect(editMode2.isEditMode.value).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('should handle rapid toggle operations', () => {
      const editMode = useEditMode()

      for (let i = 0; i < 10; i++) {
        editMode.toggleEditMode()
      }

      // Should be disabled after 10 toggles (started false, so even number = false)
      expect(editMode.isEditMode.value).toBe(false)
      expect(mockBodyClassList.add).toHaveBeenCalledTimes(5)
      expect(mockBodyClassList.remove).toHaveBeenCalledTimes(5)
    })

    it('should handle enable/disable mixed with toggle', () => {
      const editMode = useEditMode()

      editMode.enableEditMode()
      expect(editMode.isEditMode.value).toBe(true)

      editMode.toggleEditMode()
      expect(editMode.isEditMode.value).toBe(false)

      editMode.disableEditMode()
      expect(editMode.isEditMode.value).toBe(false)

      editMode.toggleEditMode()
      expect(editMode.isEditMode.value).toBe(true)
    })
  })
})