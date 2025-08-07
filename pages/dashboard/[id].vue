<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from '#app'
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
  useDarkMode,
  useWidgetPlugins,
  useDashboard,
  useDashboardSettings,
  useWidgetEventBus
} from '@/composables'
import { getGridConfig } from '~/lib/utils/grid'
import DashboardPage from '@/components/dashboard/DashboardPage.vue'
import DialogManager from '@/components/dashboard/DialogManager.vue'
import DashboardSelector from '@/components/dashboard/DashboardSelector.vue'
import LoadingPlaceholder from '@/components/common/LoadingPlaceholder.vue'
import { FloatingDock, type DockAction } from '@/components/ui/dock'
import type { Page, WidgetInstance, WidgetPosition } from '@/types'
import { Button } from "~/components/ui/button"
import { Plus } from '@/lib/icons'
import DevEditToggle from '@/components/dev/DevEditToggle.vue'

// Route params
const route = useRoute()
const router = useRouter()
const dashboardId = computed(() => Number(route.params.id))

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
const logger = useLogger({ module: 'dashboard/[id]' })
const darkMode = useDarkMode()
const widgetPlugins = useWidgetPlugins()

// Dashboard composables
const dashboardComposable = useDashboard()
const dashboardSettings = useDashboardSettings(dashboardId.value)
const showDashboardSelector = ref(false)

// Page state - filtered by dashboard
const pages = computed(() => {
  const currentDashboard = dashboardComposable.currentDashboard.value
  if (!currentDashboard || !currentDashboard.pages) return []
  return currentDashboard.pages
})

// New composables for refactoring (after pages is defined)
const widgetLoader = useWidgetLoader()
const { carouselRef, swipeContainer, currentPageIndex, currentPage, setupSwipeHandlers } = useCarouselNavigation(pages)
const dragAndDrop = useDragAndDrop(updateWidgetPosition)
const isLoadingPages = computed(() => pageOperations.loading.value || dashboardComposable.isLoading.value)
const editMode = computed(() => editModeComposable.isEditMode.value)

// Extract page UI values to avoid Ref issues in template
const { 
  showAddWidget, 
  addWidgetPageId, 
  showEditWidget, 
  editWidgetInstance, 
  showAddPage,
  newPageName,
  showRenamePage
} = pageUIComposable

const dashboardContainer = ref<HTMLElement | null>(null)

// Add a new page
async function addPage(name: string): Promise<void> {
  try {
    await pageOperations.createPage({ 
      name, 
      dashboardId: dashboardId.value 
    })
    await pageOperations.fetchPages()
    pageUIComposable.closeAddPageDialog()
  } catch (error) {
    console.error('Failed to add page:', error)
  }
}

// Delete a page
async function deletePage(page: Page): Promise<void> {
  if (pages.value.length <= 1) {
    alert('Cannot delete the last page')
    return
  }
  
  if (!confirm(`Delete page "${page.name}"?`)) return
  
  try {
    await pageOperations.deletePage(page.id)
  } catch (error) {
    console.error('Failed to delete page:', error)
  }
}

// Parse widget position from stored string or object
function parseWidgetPosition(widget: WidgetInstance): WidgetPosition {
  try {
    const pos = typeof widget.position === 'string' 
      ? JSON.parse(widget.position) 
      : widget.position
    
    // Legacy format {left, top, width?, height?}
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
    id: 'dashboard-selector',
    icon: 'LayoutGrid',
    label: 'Dashboards',
    active: showDashboardSelector.value
  },
  {
    id: 'add-widget',
    icon: 'Plus',
    label: 'Add Widget',
    active: editMode.value,
    disabled: !currentPage.value
  },
  {
    id: 'page-settings',
    icon: 'FileText', 
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
    case 'dashboard-selector':
      showDashboardSelector.value = true
      break
    case 'add-widget':
      if (currentPage.value) {
        pageUIComposable.openAddWidgetDialog(currentPage.value.id)
      }
      break
    case 'page-settings':
      if (currentPage.value) {
        pageUIComposable.openRenamePageDialog(currentPage.value)
      }
      break
    case 'theme-toggle':
      darkMode.toggleMode()
      break
  }
}

// Handle dock show (enable edit mode)
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
  
  if (!widgetsList || widgetsList.length === 0) {
    return result
  }
  
  for (const widget of widgetsList) {
    const pageId = widget.pageId || 0
    if (!result[pageId]) {
      result[pageId] = []
    }
    result[pageId].push(widget)
  }
  
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
  
  try {
    await pageOperations.updatePage(page.id, data)
    await dashboardComposable.fetchDashboard(dashboardId.value)
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

// Watch for dashboard changes
watch(dashboardId, async (newId) => {
  if (newId) {
    await dashboardComposable.fetchDashboard(newId)
  }
})

// Cleanup function for event listeners
let cleanupEventListeners: (() => void) | null = null

onMounted(async () => {
  // Initialize widget system first to avoid warnings
  await widgetPlugins.initialize()
  
  // Load dashboard and its pages
  await dashboardComposable.fetchDashboard(dashboardId.value)
  
  cleanupEventListeners = dragAndDrop.setupEventListeners(dashboardContainer, currentPage)
  setupSwipeHandlers(pages, editMode)
  widgetLoader.setupAutoLoader(pages)
  
  // Listen for dev toggle edit mode event
  const eventBus = useWidgetEventBus()
  eventBus.on('dev:toggleEditMode', () => {
    editModeComposable.toggleEditMode()
  })
})

onUnmounted(() => {
  if (cleanupEventListeners) {
    cleanupEventListeners()
  }
  dragAndDrop.tempPositions.value = {}
  
  // Cleanup event listener
  const eventBus = useWidgetEventBus()
  eventBus.off('dev:toggleEditMode')
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
        <p class="text-muted-foreground">Create your first page to get started.</p>
        <Button @click="pageUIComposable.openAddPageDialog()">
          <Plus class="w-4 h-4 mr-2" />
          Create Page
        </Button>
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
      v-if="pages && pages.length >= 0"
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

    <!-- Dashboard Selector -->
    <DashboardSelector v-model="showDashboardSelector" />
    
    <!-- Dev Edit Toggle (only in development) -->
    <DevEditToggle />
  </div>
</template>