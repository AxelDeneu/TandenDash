<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import { usePages } from '@/composables/usePages'
import { 
  useEditMode, 
  useWidgetOperations, 
  useWidgetUI, 
  usePageOperations,
  useComposableContext
} from '@/composables'
import { useWidgetSystem } from '@/composables/useWidgetSystem'
import { getGridConfig, snapToGrid, snapToGridWithMargins } from '~/lib/utils/grid'
import { useSwipeGesture } from '@/composables/useSwipeGesture'
import DashboardPage from '@/components/dashboard/DashboardPage.vue'
import DialogManager from '@/components/dashboard/DialogManager.vue'
import LoadingPlaceholder from '@/components/common/LoadingPlaceholder.vue'
import TouchToolbar from '@/components/dashboard/TouchToolbar.vue'
import ToolbarHint from '@/components/dashboard/ToolbarHint.vue'
import type { Page, WidgetInstance } from '@/types'
import { useToolbarVisibility } from '@/composables/ui/useToolbarVisibility'

// New architecture composables
const context = useComposableContext()
const widgetSystem = useWidgetSystem()
const editModeComposable = useEditMode()
const widgetOperations = useWidgetOperations()
const widgetUI = useWidgetUI()
const pageOperations = usePageOperations()
const toolbarVisibility = useToolbarVisibility()

// Pages composable
const {
  pages,
  isLoadingPages,
  showAddPage,
  newPageName,
  showRenamePage,
  pageToRename,
  fetchPages,
  addPage,
  openRenamePage,
  deletePage,
  closeRenamePageDialog,
  updateNewPageName
} = usePages()

// Temporary positions for drag/resize
const tempPositions = ref<Record<number, import('@/types').WidgetPosition>>({})

// Dashboard container ref for snapping calculations
const dashboardContainer = ref<HTMLElement | null>(null)

// Parse widget position from string
const parseWidgetPosition = (widget: WidgetInstance): import('@/types').WidgetPosition => {
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

// Drag state
const dragState = ref<{
  widgetId: number
  offsetX: number
  offsetY: number
} | null>(null)

// Resize state  
const resizeState = ref<{
  widgetId: number
  startX: number
  startY: number
  startWidth: number
  startHeight: number
} | null>(null)

// Handle drag start
const handleDragStart = (e: MouseEvent | TouchEvent, widget: WidgetInstance, page: Page) => {
  e.stopPropagation()
  const event = 'touches' in e ? e.touches[0] : e
  const position = parseWidgetPosition(widget)
  
  dragState.value = {
    widgetId: widget.id,
    offsetX: event.clientX - position.x,
    offsetY: event.clientY - position.y
  }
  
  tempPositions.value[widget.id] = { ...position }
  widgetUI.startDrag(widget, { x: event.clientX, y: event.clientY })
}

// Handle resize start
const handleResizeStart = (e: MouseEvent | TouchEvent, widget: WidgetInstance, page: Page) => {
  e.stopPropagation()
  const event = 'touches' in e ? e.touches[0] : e
  const position = parseWidgetPosition(widget)
  
  resizeState.value = {
    widgetId: widget.id,
    startX: event.clientX,
    startY: event.clientY,
    startWidth: position.width,
    startHeight: position.height
  }
  
  tempPositions.value[widget.id] = { ...position }
  widgetUI.startResize(widget, { width: position.width, height: position.height })
}

// Fonction pour mettre à jour la position d'un widget
const updateWidgetPosition = async (widgetId: number, position: import('@/types').WidgetPosition) => {
  try {
    await widgetOperations.updateWidget({
      id: widgetId,
      position: position
    })
  } catch (error) {
    console.error('Failed to update widget position:', error)
  }
}

// Helper function to apply snapping and margin constraints to position
const applySnapping = (position: import('@/types').WidgetPosition): import('@/types').WidgetPosition => {
  if (!currentPage.value || !dashboardContainer.value) {
    return position
  }
  
  const containerRect = dashboardContainer.value.getBoundingClientRect()
  const snapped = snapToGridWithMargins(
    position.x,
    position.y,
    position.width,
    position.height,
    currentPage.value,
    containerRect.width,
    containerRect.height
  )
  
  return {
    x: snapped.x,
    y: snapped.y,
    width: snapped.w,
    height: snapped.h
  }
}

// Listeners globaux pour mouse/touch events
const setupEventListeners = () => {
  // Mouse events
  const handleMouseMove = (e: MouseEvent) => {
    if (dragState.value) {
      const { widgetId, offsetX, offsetY } = dragState.value
      const newX = e.clientX - offsetX
      const newY = e.clientY - offsetY
      
      if (tempPositions.value[widgetId]) {
        const newPosition = {
          ...tempPositions.value[widgetId],
          x: newX,
          y: newY
        }
        
        // Apply snapping for drag operations
        tempPositions.value[widgetId] = applySnapping(newPosition)
      }
      
      widgetUI.updateDrag({ x: e.clientX, y: e.clientY })
    } else if (resizeState.value) {
      const { widgetId, startX, startY, startWidth, startHeight } = resizeState.value
      const deltaX = e.clientX - startX
      const deltaY = e.clientY - startY
      
      const newWidth = Math.max(300, startWidth + deltaX)
      const newHeight = Math.max(200, startHeight + deltaY)
      
      if (tempPositions.value[widgetId]) {
        const newPosition = {
          ...tempPositions.value[widgetId],
          width: newWidth,
          height: newHeight
        }
        
        // Apply snapping for resize operations
        tempPositions.value[widgetId] = applySnapping(newPosition)
      }
      
      widgetUI.updateResize({ width: newWidth, height: newHeight })
    }
  }
  
  const handleMouseUp = async () => {
    if (dragState.value) {
      const { widgetId } = dragState.value
      const finalPosition = tempPositions.value[widgetId]
      
      if (finalPosition) {
        await updateWidgetPosition(widgetId, finalPosition)
      }
      
      delete tempPositions.value[widgetId]
      dragState.value = null
      widgetUI.endDrag()
    } else if (resizeState.value) {
      const { widgetId } = resizeState.value
      const finalPosition = tempPositions.value[widgetId]
      
      if (finalPosition) {
        await updateWidgetPosition(widgetId, finalPosition)
      }
      
      delete tempPositions.value[widgetId]
      resizeState.value = null
      widgetUI.endResize()
    }
  }
  
  // Touch events
  const handleTouchMove = (e: TouchEvent) => {
    if (dragState.value || resizeState.value) {
      e.preventDefault()
      const touch = e.touches[0]
      
      if (dragState.value) {
        const { widgetId, offsetX, offsetY } = dragState.value
        const newX = touch.clientX - offsetX
        const newY = touch.clientY - offsetY
        
        if (tempPositions.value[widgetId]) {
          const newPosition = {
            ...tempPositions.value[widgetId],
            x: newX,
            y: newY
          }
          
          // Apply snapping for touch drag operations
          tempPositions.value[widgetId] = applySnapping(newPosition)
        }
        
        widgetUI.updateDrag({ x: touch.clientX, y: touch.clientY })
      } else if (resizeState.value) {
        const { widgetId, startX, startY, startWidth, startHeight } = resizeState.value
        const deltaX = touch.clientX - startX
        const deltaY = touch.clientY - startY
        
        const newWidth = Math.max(300, startWidth + deltaX)
        const newHeight = Math.max(200, startHeight + deltaY)
        
        if (tempPositions.value[widgetId]) {
          const newPosition = {
            ...tempPositions.value[widgetId],
            width: newWidth,
            height: newHeight
          }
          
          // Apply snapping for touch resize operations
          tempPositions.value[widgetId] = applySnapping(newPosition)
        }
        
        widgetUI.updateResize({ width: newWidth, height: newHeight })
      }
    }
  }
  
  const handleTouchEnd = async (e: TouchEvent) => {
    if (dragState.value) {
      const { widgetId } = dragState.value
      const finalPosition = tempPositions.value[widgetId]
      
      if (finalPosition) {
        await updateWidgetPosition(widgetId, finalPosition)
      }
      
      delete tempPositions.value[widgetId]
      dragState.value = null
      widgetUI.endDrag()
    } else if (resizeState.value) {
      const { widgetId } = resizeState.value
      const finalPosition = tempPositions.value[widgetId]
      
      if (finalPosition) {
        await updateWidgetPosition(widgetId, finalPosition)
      }
      
      delete tempPositions.value[widgetId]
      resizeState.value = null
      widgetUI.endResize()
    }
  }
  
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)
  window.addEventListener('touchmove', handleTouchMove, { passive: false })
  window.addEventListener('touchend', handleTouchEnd)
  
  // Cleanup function
  return () => {
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
    window.removeEventListener('touchmove', handleTouchMove)
    window.removeEventListener('touchend', handleTouchEnd)
  }
}

// Debounced fetch function to avoid too many requests
const debouncedFetchWidgets = useDebounceFn(async (pageId: number) => {
  // Mark page as needing refresh
  loadedPageIds.value.delete(pageId)
  await fetchWidgetsForPage(pageId)
}, 1000)

// Watch for drag/resize completion to refresh widgets
watch([widgetUI.isDragging, widgetUI.isResizing], ([dragging, resizing], [prevDragging, prevResizing]) => {
  // When dragging or resizing ends
  if ((prevDragging && !dragging) || (prevResizing && !resizing)) {
    // Refresh widgets for current page with debounce
    if (currentPage.value) {
      debouncedFetchWidgets(currentPage.value.id)
    }
  }
})

// Carousel and swipe support
const carouselRef = ref<InstanceType<typeof Carousel> | null>(null)
const swipeContainer = ref<HTMLElement | null>(null)
const currentPageIndex = ref(0)

// Setup swipe gestures (only when carrousel drag is disabled)
const { onSwipeLeft, onSwipeRight } = useSwipeGesture(swipeContainer, {
  threshold: 50,
  timeout: 300,
  preventDefault: false // Let carousel handle drag when enabled
})

// Swipe handlers - only active when carousel drag is disabled
onSwipeLeft.value = () => {
  if (editMode.value && carouselRef.value?.scrollNext) {
    carouselRef.value.scrollNext()
    if (currentPageIndex.value < pages.value.length - 1) {
      currentPageIndex.value++
    }
  }
}

onSwipeRight.value = () => {
  if (editMode.value && carouselRef.value?.scrollPrev) {
    carouselRef.value.scrollPrev()
    if (currentPageIndex.value > 0) {
      currentPageIndex.value--
    }
  }
}

// Go to specific page
const goToPage = (index: number) => {
  if (carouselRef.value?.carouselApi) {
    carouselRef.value.carouselApi.scrollTo(index)
    currentPageIndex.value = index
  }
}

// Reset page index when pages change
watch(pages, (newPages) => {
  if (newPages.length > 0 && currentPageIndex.value >= newPages.length) {
    currentPageIndex.value = 0
  }
})

// Computed properties
const editMode = computed(() => editModeComposable.isEditMode.value)
const currentPage = computed(() => pages.value[currentPageIndex.value] || null)

// Handle edit mode toggle
function handleToggleEditMode() {
  editModeComposable.toggleEditMode()
  
  // Show toolbar when entering edit mode
  if (editModeComposable.isEditMode.value) {
    toolbarVisibility.forceShow()
  } else {
    // Re-enable auto-hide when exiting edit mode
    toolbarVisibility.showToolbar()
  }
}

// Show toolbar when interacting with widgets
watch(editMode, (isEdit) => {
  if (isEdit) {
    toolbarVisibility.forceShow()
  }
})

// Widgets par page avec positions temporaires
const widgetsByPage = computed(() => {
  const result: Record<number, WidgetInstance[]> = {}
  const widgetsList = widgetOperations.widgets.value
  
  if (!widgetsList) {
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

// Dialog states
const showAddWidget = ref(false)
const addWidgetPageId = ref<number | null>(null)
const showEditWidget = ref(false)
const editWidgetInstance = ref<WidgetInstance | null>(null)


// Widget operations
async function fetchWidgetsForPage(pageId: number): Promise<void> {
  try {
    await widgetOperations.fetchWidgets(pageId)
    loadedPageIds.value.add(pageId)
  } catch (error) {
    console.error(`Failed to fetch widgets for page ${pageId}:`, error)
    // Remove from loaded pages on error so it can be retried
    loadedPageIds.value.delete(pageId)
  }
}

function openAddWidget(pageId?: number): void {
  const targetPageId = pageId !== undefined ? pageId : currentPage.value?.id
  
  if (!targetPageId) {
    return
  }
  
  addWidgetPageId.value = targetPageId
  showAddWidget.value = true
}

async function handleWidgetAdded(pageId: number): Promise<void> {
  await fetchWidgetsForPage(pageId)
  showAddWidget.value = false
  addWidgetPageId.value = null
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

function openEditWidget(widget: WidgetInstance, pageId: number): void {
  editWidgetInstance.value = widget
  showEditWidget.value = true
}

async function handleWidgetEdited(pageId: number): Promise<void> {
  await fetchWidgetsForPage(pageId)
  showEditWidget.value = false
  editWidgetInstance.value = null
  context.events.emit('widget:edit-completed', pageId)
}

// Event handlers
const openAddPageFromMenu = () => {
  showAddPage.value = true
}

const openRenamePageFromMenu = (page: Page) => {
  openRenamePage(page)
}

const openDeletePageFromMenu = (page: Page) => {
  deletePage(page)
}

// Handle page edit from dialog
const handleEditPage = async (data: { name: string; snapping: boolean; gridRows: number; gridCols: number }) => {
  const page = currentPage.value
  if (!page) return
  
  console.log('[handleEditPage] Received data from dialog:', data)
  console.log('[handleEditPage] Current page id:', page.id)
  
  try {
    await pageOperations.updatePage(page.id, data)
    await fetchPages()
    closeRenamePageDialog()
  } catch (error) {
    console.error('Error updating page:', error)
  }
}

// Subscribe to widget events
context.events.on('widget:created', (widget) => {
  // Widget created - handled by operations layer
})

context.events.on('widget:updated', (widget) => {
  // Widget updated - handled by operations layer  
})

context.events.on('widget:deleted', (widget) => {
  // Clear selection if deleted widget was selected
  widgetUI.deselectWidget(widget.id)
})

// Track loaded pages to avoid duplicate fetches
const loadedPageIds = ref(new Set<number>())

// Cleanup function for event listeners
let cleanupEventListeners: (() => void) | null = null

onMounted(async () => {
  await fetchPages()
  cleanupEventListeners = setupEventListeners()
})

onUnmounted(() => {
  if (cleanupEventListeners) {
    cleanupEventListeners()
  }
  tempPositions.value = {}
})

// Watch for page changes to initialize widgets
watch(pages, async (newPages) => {
  // Ensure newPages is an array before iterating
  if (!Array.isArray(newPages)) return
  
  // Only fetch widgets for pages that haven't been loaded yet
  for (const page of newPages) {
    if (!loadedPageIds.value.has(page.id)) {
      loadedPageIds.value.add(page.id)
      // Add a small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
      await fetchWidgetsForPage(page.id)
    }
  }
}, { immediate: true })
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
            :temp-positions="tempPositions"
            @add-widget="openAddWidget"
            @add-page="openAddPageFromMenu"
            @rename-page="openRenamePageFromMenu"
            @delete-page="openDeletePageFromMenu"
            @widget-dragstart="handleDragStart"
            @widget-resize-start="handleResizeStart"
            @widget-edit="openEditWidget"
            @widget-delete="deleteWidget"
          />
        </CarouselItem>
      </CarouselContent>
    </Carousel>
    
    <!-- Touch-optimized toolbar -->
    <Transition
      enter-active-class="transition-transform duration-300 ease-out"
      enter-from-class="translate-y-full"
      enter-to-class="translate-y-0"
      leave-active-class="transition-transform duration-300 ease-in"
      leave-from-class="translate-y-0"
      leave-to-class="translate-y-full"
    >
      <TouchToolbar
        v-if="pages && pages.length > 0 && toolbarVisibility.isVisible.value"
        :edit-mode="editMode"
        :current-page-index="currentPageIndex"
        :total-pages="pages.length"
        :can-add-widget="true"
        @toggle-edit-mode="handleToggleEditMode"
        @add-widget="openAddWidget"
        @go-to-page="goToPage"
        @open-settings="() => currentPage && openRenamePage(currentPage)"
      />
    </Transition>
    
    <!-- Toolbar hint when hidden -->
    <ToolbarHint 
      :show="!toolbarVisibility.isVisible.value && pages && pages.length > 0"
      @click="toolbarVisibility.showToolbar"
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
      @close-add-widget="showAddWidget = false"
      @widget-added="handleWidgetAdded"
      @close-edit-widget="showEditWidget = false"
      @widget-edited="handleWidgetEdited"
      @close-add-page="showAddPage = false"
      @add-page="addPage"
      @close-edit-page="closeRenamePageDialog()"
      @edit-page="handleEditPage"
      @update:new-page-name="updateNewPageName($event)"
    />
  </div>
</template>