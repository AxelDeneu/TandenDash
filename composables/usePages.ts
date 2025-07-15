// TEMPORARY: Backward compatibility wrapper
// This composable combines usePageOperations and usePageUI for backward compatibility
// New code should use usePageOperations and usePageUI directly

import { usePageOperations, usePageUI } from '@/composables'
import type { Page } from '@/types'

export function usePages() {
  const pageOperations = usePageOperations()
  const pageUI = usePageUI()

  // Expose operations
  const fetchPages = () => pageOperations.fetchPages()
  
  const addPage = async () => {
    if (!pageUI.newPageName.value.trim()) return
    
    try {
      await pageOperations.createPage({
        name: pageUI.newPageName.value,
        snapping: pageUI.newPageSnapping.value,
        gridRows: pageUI.newPageGridRows.value,
        gridCols: pageUI.newPageGridCols.value
      })
      await pageOperations.fetchPages()
      pageUI.closeAddPageDialog()
    } catch (error) {
      console.error('Error adding page:', error)
    }
  }

  const openRenamePage = (page: Page) => {
    pageUI.openRenamePageDialog(page)
  }

  const renamePage = async () => {
    const pageToEdit = pageUI.pageToEdit.value
    if (!pageUI.newPageName.value.trim() || !pageToEdit) return
    
    try {
      await pageOperations.updatePage(pageToEdit.id, {
        name: pageUI.newPageName.value,
        snapping: pageUI.newPageSnapping.value,
        gridRows: pageUI.newPageGridRows.value,
        gridCols: pageUI.newPageGridCols.value
      })
      await pageOperations.fetchPages()
      pageUI.closeRenamePageDialog()
    } catch (error) {
      console.error('Error renaming page:', error)
    }
  }

  const deletePage = async (page: Page) => {
    if (!confirm('Delete this page?')) return
    
    try {
      await pageOperations.deletePage(page.id)
      await pageOperations.fetchPages()
    } catch (error) {
      console.error('Error deleting page:', error)
    }
  }

  // Return combined interface for backward compatibility
  return {
    // From pageOperations
    pages: pageOperations.pages,
    isLoadingPages: pageOperations.loading,
    
    // From pageUI
    showAddPage: pageUI.showAddPage,
    newPageName: pageUI.newPageName,
    showRenamePage: pageUI.showRenamePage,
    renamePageName: pageUI.newPageName,
    pageToRename: pageUI.pageToEdit,
    renamePageSnapping: pageUI.newPageSnapping,
    renamePageGridRows: pageUI.newPageGridRows,
    renamePageGridCols: pageUI.newPageGridCols,
    
    // Operations
    fetchPages,
    addPage,
    openRenamePage,
    renamePage,
    deletePage,
    closeRenamePageDialog: pageUI.closeRenamePageDialog,
    
    // Update functions for v-model
    updateNewPageName: pageUI.updateNewPageName,
    updateNewPageSnapping: pageUI.updateNewPageSnapping,
    updateNewPageGridRows: pageUI.updateNewPageGridRows,
    updateNewPageGridCols: pageUI.updateNewPageGridCols
  }
}