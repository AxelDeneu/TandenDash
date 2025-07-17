import { ref, computed, readonly, type Ref, type ComputedRef } from 'vue'
import type { Page, WidgetInstance } from '@/types'
import { useComposableContext } from '../core/ComposableContext'

export interface UsePageUI {
  dialogState: Ref<{
    showAddPage: boolean
    showRenamePage: boolean
    pageToEdit: Page | null
    newPageName: string
    newPageSnapping: boolean
    newPageGridRows: number
    newPageGridCols: number
    // Widget dialog states
    showAddWidget: boolean
    addWidgetPageId: number | null
    showEditWidget: boolean
    editWidgetInstance: WidgetInstance | null
  }>
  showAddPage: ComputedRef<boolean>
  showRenamePage: ComputedRef<boolean>
  pageToEdit: ComputedRef<Page | null>
  newPageName: ComputedRef<string>
  newPageSnapping: ComputedRef<boolean>
  newPageGridRows: ComputedRef<number>
  newPageGridCols: ComputedRef<number>
  // Widget dialog computed properties
  showAddWidget: ComputedRef<boolean>
  addWidgetPageId: ComputedRef<number | null>
  showEditWidget: ComputedRef<boolean>
  editWidgetInstance: ComputedRef<WidgetInstance | null>
  
  openAddPageDialog(): void
  closeAddPageDialog(): void
  openRenamePageDialog(page: Page): void
  closeRenamePageDialog(): void
  updateNewPageName(value: string): void
  updateNewPageSnapping(value: boolean): void
  updateNewPageGridRows(value: number): void
  updateNewPageGridCols(value: number): void
  // Widget dialog methods
  openAddWidgetDialog(pageId?: number, currentPageId?: number): void
  closeAddWidgetDialog(): void
  openEditWidgetDialog(widget: WidgetInstance): void
  closeEditWidgetDialog(): void
}

export function usePageUI(): UsePageUI {
  const context = useComposableContext()
  
  // Dialog states
  const dialogState = ref({
    showAddPage: false,
    showRenamePage: false,
    pageToEdit: null as Page | null,
    newPageName: '',
    newPageSnapping: false,
    newPageGridRows: 6,
    newPageGridCols: 6,
    // Widget dialog states
    showAddWidget: false,
    addWidgetPageId: null as number | null,
    showEditWidget: false,
    editWidgetInstance: null as WidgetInstance | null
  })

  // Open add page dialog
  function openAddPageDialog(): void {
    dialogState.value.showAddPage = true
    dialogState.value.newPageName = ''
    dialogState.value.newPageSnapping = false
    dialogState.value.newPageGridRows = 6
    dialogState.value.newPageGridCols = 6
    context.events.emit('page:add-dialog-opened')
  }

  // Close add page dialog
  function closeAddPageDialog(): void {
    dialogState.value.showAddPage = false
    dialogState.value.newPageName = ''
    context.events.emit('page:add-dialog-closed')
  }

  // Open rename page dialog
  function openRenamePageDialog(page: Page): void {
    dialogState.value.pageToEdit = page
    dialogState.value.newPageName = page.name
    dialogState.value.newPageSnapping = !!page.snapping
    dialogState.value.newPageGridRows = page.gridRows || 6
    dialogState.value.newPageGridCols = page.gridCols || 6
    dialogState.value.showRenamePage = true
    context.events.emit('page:rename-dialog-opened', page)
  }

  // Close rename page dialog
  function closeRenamePageDialog(): void {
    dialogState.value.showRenamePage = false
    dialogState.value.pageToEdit = null
    dialogState.value.newPageName = ''
    dialogState.value.newPageSnapping = false
    dialogState.value.newPageGridRows = 6
    dialogState.value.newPageGridCols = 6
    context.events.emit('page:rename-dialog-closed')
  }

  // Update dialog form values
  function updateNewPageName(value: string): void {
    dialogState.value.newPageName = value
  }

  function updateNewPageSnapping(value: boolean): void {
    dialogState.value.newPageSnapping = value
  }

  function updateNewPageGridRows(value: number): void {
    dialogState.value.newPageGridRows = value
  }

  function updateNewPageGridCols(value: number): void {
    dialogState.value.newPageGridCols = value
  }

  // Widget dialog methods
  function openAddWidgetDialog(pageId?: number, currentPageId?: number): void {
    const targetPageId = pageId !== undefined ? pageId : currentPageId
    
    if (!targetPageId) {
      return
    }
    
    dialogState.value.addWidgetPageId = targetPageId
    dialogState.value.showAddWidget = true
    context.events.emit('widget:add-dialog-opened', targetPageId)
  }
  
  function closeAddWidgetDialog(): void {
    dialogState.value.showAddWidget = false
    dialogState.value.addWidgetPageId = null
    context.events.emit('widget:add-dialog-closed')
  }
  
  function openEditWidgetDialog(widget: WidgetInstance): void {
    dialogState.value.editWidgetInstance = widget
    dialogState.value.showEditWidget = true
    context.events.emit('widget:edit-dialog-opened', widget)
  }
  
  function closeEditWidgetDialog(): void {
    dialogState.value.showEditWidget = false
    dialogState.value.editWidgetInstance = null
    context.events.emit('widget:edit-dialog-closed')
  }

  // Computed properties
  const showAddPage = computed(() => dialogState.value.showAddPage)
  const showRenamePage = computed(() => dialogState.value.showRenamePage)
  const pageToEdit = computed(() => dialogState.value.pageToEdit)
  const newPageName = computed(() => dialogState.value.newPageName)
  const newPageSnapping = computed(() => dialogState.value.newPageSnapping)
  const newPageGridRows = computed(() => dialogState.value.newPageGridRows)
  const newPageGridCols = computed(() => dialogState.value.newPageGridCols)
  // Widget dialog computed properties
  const showAddWidget = computed(() => dialogState.value.showAddWidget)
  const addWidgetPageId = computed(() => dialogState.value.addWidgetPageId)
  const showEditWidget = computed(() => dialogState.value.showEditWidget)
  const editWidgetInstance = computed(() => dialogState.value.editWidgetInstance)

  return {
    dialogState: readonly(dialogState),
    showAddPage,
    showRenamePage,
    pageToEdit,
    newPageName,
    newPageSnapping,
    newPageGridRows,
    newPageGridCols,
    showAddWidget,
    addWidgetPageId,
    showEditWidget,
    editWidgetInstance,
    openAddPageDialog,
    closeAddPageDialog,
    openRenamePageDialog,
    closeRenamePageDialog,
    updateNewPageName,
    updateNewPageSnapping,
    updateNewPageGridRows,
    updateNewPageGridCols,
    openAddWidgetDialog,
    closeAddWidgetDialog,
    openEditWidgetDialog,
    closeEditWidgetDialog
  }
}