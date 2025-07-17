<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import { 
  useEditMode, 
  useWidgetOperations, 
  useWidgetUI, 
  usePageOperations,
  usePageUI,
  useComposableContext,
  useLogger,
  useFloatingDock,
  useDragAndDrop,
  useCarouselNavigation,
  useWidgetLoader,
  useDarkMode
} from '@/composables'
import { getGridConfig } from '~/lib/utils/grid'
import DashboardPage from '@/components/dashboard/DashboardPage.vue'
import DialogManager from '@/components/dashboard/DialogManager.vue'
import LoadingPlaceholder from '@/components/common/LoadingPlaceholder.vue'
import { FloatingDock, type DockAction } from '@/components/ui/dock'
import type { Page, WidgetInstance, WidgetPosition } from '@/types'

// New architecture composables
const context = useComposableContext()
const editModeComposable = useEditMode()
const widgetOperations = useWidgetOperations()
const widgetUI = useWidgetUI()
const pageOperations = usePageOperations()
const pageUIComposable = usePageUI()
const floatingDock = useFloatingDock({
  autoHideDelay: 30000
})
const logger = useLogger({ module: 'pages/index' })
const darkMode = useDarkMode()

// Page state
const pages = computed(() => pageOperations.pages.value)

// New composables for refactoring (after pages is defined)
const widgetLoader = useWidgetLoader()
const { carouselRef, swipeContainer, currentPageIndex, currentPage, setupSwipeHandlers } = useCarouselNavigation(pages)
const dragAndDrop = useDragAndDrop(updateWidgetPosition)
const isLoadingPages = computed(() => pageOperations.loading.value)
const editMode = computed(() => editModeComposable.isEditMode.value)

// Extract page UI values to avoid Ref issues in template
const showAddWidget = computed(() => pageUIComposable.showAddWidget.value)
const addWidgetPageId = computed(() => pageUIComposable.addWidgetPageId.value)
const showEditWidget = computed(() => pageUIComposable.showEditWidget.value)
const editWidgetInstance = computed(() => pageUIComposable.editWidgetInstance.value)
const showAddPage = computed(() => pageUIComposable.showAddPage.value)
const newPageName = computed(() => pageUIComposable.newPageName.value)
const showRenamePage = computed(() => pageUIComposable.showRenamePage.value)

// Dashboard container ref for snapping calculations
const dashboardContainer = ref<HTMLElement | null>()

// Add page handler
const addPage = async () => {
  if (!pageUIComposable.newPageName.value.trim()) return
  
  try {
    await pageOperations.createPage({
      name: pageUIComposable.newPageName.value,
      snapping: pageUIComposable.newPageSnapping.value,
      gridRows: pageUIComposable.newPageGridRows.value,
      gridCols: pageUIComposable.newPageGridCols.value
    })
    await pageOperations.fetchPages()
    pageUIComposable.closeAddPageDialog()
  } catch (error) {
    logger.error('Error adding page', error as Error)
  }
}

// Delete page handler
const deletePage = async (page: Page) => {
  if (!confirm('Delete this page?')) return
  
  try {
    await pageOperations.deletePage(page.id)
    await pageOperations.fetchPages()
  } catch (error) {
    logger.error('Error deleting page', error as Error)
  }
}

// Parse widget position from string
const parseWidgetPosition = (widget: WidgetInstance): WidgetPosition => {
  try {
    const pos = JSON.parse(widget.position)
    
    // Handle old format {left, top, width, height}
    if ('left' in pos && 'top' in pos) {
      return {
        x: parseInt(pos.left),
        y: parseInt(pos.top),
        width: parseInt(pos.width || '300'),
        height: parseInt(pos.height || '200')
      }
    }
    
    // New format {x, y, width, height}
    return pos
  } catch {
    // Default position on error
    return { x: 100, y: 100, width: 300, height: 200 }
  }
}

// Fonction pour mettre à jour la position d'un widget
async function updateWidgetPosition(widgetId: number, position: WidgetPosition): Promise<void> {
  try {
    await widgetOperations.updateWidget({
      id: widgetId,
      position: position
    })
  } catch (error) {
    console.error('Failed to update widget position:', error)
  }
}

// Handle drag start
const handleDragStart = (e: MouseEvent | TouchEvent, widget: WidgetInstance, page: Page) => {
  const position = parseWidgetPosition(widget)
  dragAndDrop.handleDragStart(e, widget, page, position)
}

// Handle resize start
const handleResizeStart = (e: MouseEvent | TouchEvent, widget: WidgetInstance, page: Page) => {
  const position = parseWidgetPosition(widget)
  dragAndDrop.handleResizeStart(e, widget, page, position)
}


// Watch for drag/resize completion to refresh widgets
watch([widgetUI.isDragging, widgetUI.isResizing], ([dragging, resizing], [prevDragging, prevResizing]) => {
  // When dragging or resizing ends
  if ((prevDragging && !dragging) || (prevResizing && !resizing)) {
    // Refresh widgets for current page with debounce
    if (currentPage.value) {
      widgetLoader.debouncedFetchWidgets(currentPage.value.id)
    }
  }
})

// Dock actions configuration
const dockActions = computed<DockAction[]>(() => [
  {
    id: 'add-widget',
    icon: 'Plus',
    label: 'Add Widget',
    active: editMode.value,
    disabled: !currentPage.value
  },
  {
    id: 'settings',
    icon: 'Settings', 
    label: 'Page Settings',
    disabled: !currentPage.value
  },
  {
    id: 'theme-toggle',
    icon: darkMode.isDark.value ? 'Sun' : 'Moon',
    label: darkMode.isDark.value ? 'Light Mode' : 'Dark Mode'
  }
])

// Handle dock action clicks
function handleDockAction(actionId: string, event: MouseEvent): void {
  switch (actionId) {
    case 'add-widget':
      if (currentPage.value) {
        pageUIComposable.openAddWidgetDialog(currentPage.value.id)
      }
      break
    case 'settings':
      if (currentPage.value) {
        pageUIComposable.openRenamePageDialog(currentPage.value)
      }
      break
    case 'theme-toggle':
      darkMode.toggleMode()
      break
    default:
      logger.warn('Unknown dock action:', actionId)
  }
}

// Handle dock show (auto-enable edit mode)
function handleDockShow(): void {
  if (!editMode.value) {
    editModeComposable.enableEditMode()
  }
}

// Handle dock hide (disable edit mode)
function handleDockHide(): void {
  if (editMode.value) {
    editModeComposable.disableEditMode()
  }
}

// Widgets par page avec positions temporaires
const widgetsByPage = computed(() => {
  const result: Record<number, WidgetInstance[]> = {}
  const widgetsList = widgetOperations.widgets.value
  
  // Debug log to see what's in widgets
  logger.debug('Computing widgetsByPage', { 
    widgetsCount: widgetsList?.length || 0,
    widgets: widgetsList,
    widgetsType: typeof widgetsList,
    isArray: Array.isArray(widgetsList)
  })
  
  if (!widgetsList || widgetsList.length === 0) {
    logger.debug('No widgets found in widgetOperations')
    return result
  }
  
  for (const widget of widgetsList) {
    const pageId = widget.pageId || 0
    if (!result[pageId]) {
      result[pageId] = []
    }
    result[pageId].push(widget)
  }
  
  logger.debug('Widgets grouped by page', result)
  return result
})


// Widget operations
async function handleWidgetAdded(pageId: number): Promise<void> {
  await widgetLoader.fetchWidgetsForPage(pageId)
  pageUIComposable.closeAddWidgetDialog()
  context.events.emit('widget:add-completed', pageId)
}

async function deleteWidget(widget: WidgetInstance, pageId: number): Promise<void> {
  if (!confirm('Delete this widget?')) return

  try {
    await widgetOperations.deleteWidget(widget.id)
    context.events.emit('widget:delete-completed', widget.id, pageId)
  } catch (error) {
    console.error(`Failed to delete widget ${widget.id}:`, error)
  }
}

async function handleWidgetEdited(pageId: number): Promise<void> {
  await widgetLoader.fetchWidgetsForPage(pageId)
  pageUIComposable.closeEditWidgetDialog()
  context.events.emit('widget:edit-completed', pageId)
}


// Handle page edit from dialog
const handleEditPage = async (data: { name: string; snapping: boolean; gridRows: number; gridCols: number }) => {
  const page = pageUIComposable.pageToEdit.value
  if (!page) return
  
  logger.debug('Received data from dialog:', data)
  logger.debug('Current page id:', page.id)
  
  try {
    await pageOperations.updatePage(page.id, data)
    await pageOperations.fetchPages()
    pageUIComposable.closeRenamePageDialog()
  } catch (error) {
    logger.error('Error updating page:', error as Error)
  }
}

// Subscribe to widget events
context.events.on('widget:deleted', (widget) => {
  // Clear selection if deleted widget was selected
  widgetUI.deselectWidget(widget.id)
})

// Cleanup function for event listeners
let cleanupEventListeners: (() => void) | null = null

onMounted(async () => {
  await pageOperations.fetchPages()
  cleanupEventListeners = dragAndDrop.setupEventListeners(dashboardContainer, currentPage)
  setupSwipeHandlers(pages, editMode)
  widgetLoader.setupAutoLoader(pages)
})

onUnmounted(() => {
  if (cleanupEventListeners) {
    cleanupEventListeners()
  }
  dragAndDrop.tempPositions.value = {}
})
</script>

<template>
  <div ref="dashboardContainer" :class="['h-screen w-screen overflow-hidden relative', { 'edit-mode': editMode }]">
    
    <!-- Loading state for pages -->
    <LoadingPlaceholder 
      v-if="isLoadingPages" 
      type="page" 
      message="Loading dashboard..."
      :show-skeleton="true"
    />
    
    <!-- Show message if no pages exist -->
    <div v-else-if="!pages || pages.length === 0" class="flex items-center justify-center h-full">
      <div class="text-center space-y-4">
        <h2 class="text-2xl font-semibold text-muted-foreground">No pages found</h2>
        <p class="text-muted-foreground">Create your first dashboard page to get started.</p>
      </div>
    </div>
    
    <Carousel 
      v-else 
      ref="carouselRef" 
      class="w-full h-full" 
      :opts="{ watchDrag: !editMode }"
      @init-api="(api) => {
        api.on('select', () => {
          currentPageIndex = api.selectedScrollSnap()
        })
      }"
    >
      <CarouselContent ref="swipeContainer" class="h-full w-full ml-0 mr-0">
        <CarouselItem 
          v-for="page in pages" 
          :key="page.id" 
          class="h-screen w-screen ml-0 mr-0 pl-0 pr-0 relative overflow-hidden"
        >
          <DashboardPage
            :page="page"
            :widgets="widgetsByPage[page.id] || []"
            :edit-mode="editMode"
            :grid-config="getGridConfig(page)"
            :is-loading-widgets="widgetOperations.loading.value"
            :temp-positions="dragAndDrop.tempPositions.value"
            :dragging-widget-id="dragAndDrop.dragState.value?.widgetId"
            @add-widget="pageUIComposable.openAddWidgetDialog($event, currentPage?.id)"
            @add-page="pageUIComposable.openAddPageDialog()"
            @rename-page="pageUIComposable.openRenamePageDialog"
            @delete-page="deletePage"
            @widget-dragstart="handleDragStart"
            @widget-resize-start="handleResizeStart"
            @widget-edit="pageUIComposable.openEditWidgetDialog"
            @widget-delete="deleteWidget"
          />
        </CarouselItem>
      </CarouselContent>
    </Carousel>
    
    <!-- Floating Dock -->
    <FloatingDock
      v-if="pages && pages.length > 0"
      :actions="dockActions"
      :edit-mode="editMode"
      size="md"
      @action-click="handleDockAction"
      @dock-show="handleDockShow"
      @dock-hide="handleDockHide"
    />

    <DialogManager
      :edit-mode="editMode"
      :show-add-widget="showAddWidget"
      :add-widget-page-id="addWidgetPageId"
      :show-edit-widget="showEditWidget"
      :edit-widget-instance="editWidgetInstance"
      :show-add-page="showAddPage"
      :new-page-name="newPageName"
      :show-rename-page="showRenamePage"
      :page-to-edit="currentPage"
      @close-add-widget="pageUIComposable.closeAddWidgetDialog()"
      @widget-added="handleWidgetAdded"
      @close-edit-widget="pageUIComposable.closeEditWidgetDialog()"
      @widget-edited="handleWidgetEdited"
      @close-add-page="pageUIComposable.closeAddPageDialog()"
      @add-page="addPage"
      @close-edit-page="pageUIComposable.closeRenamePageDialog()"
      @edit-page="handleEditPage"
      @update:new-page-name="pageUIComposable.updateNewPageName($event)"
    />
  </div>
</template>