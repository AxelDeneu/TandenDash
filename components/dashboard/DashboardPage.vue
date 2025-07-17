<template>
  <AppErrorBoundary fallback-message="Failed to load dashboard page. Please try again.">
    <div class="w-full h-full relative">
      <PageContextMenu
        :page="page"
        :edit-mode="editMode"
        @add-widget="$emit('add-widget', page.id)"
        @add-page="$emit('add-page')"
        @rename-page="$emit('rename-page', page)"
        @delete-page="$emit('delete-page', page)"
      >
        <div class="w-full h-full" data-testid="page-context-trigger">
          <!-- Loading state for widgets -->
          <div v-if="isLoadingWidgets && widgets.length === 0" class="widget-loading-container">
            <LoadingPlaceholder 
              v-for="i in 3" 
              :key="i"
              type="widget" 
              message="Loading widgets..."
              :show-skeleton="true"
              class="widget-placeholder"
            />
          </div>
          
          <!-- Widgets -->
          <AppErrorBoundary 
            v-for="widget in widgets"
            :key="`${widget.id}-${widget.options}`"
            fallback-message="This widget encountered an error."
            :max-retries="2"
          >
            <WidgetCard
              :widget="widget"
              :page="page"
              :edit-mode="editMode"
              :temp-position="tempPositions?.[widget.id]"
              :is-dragging="draggingWidgetId === widget.id"
              @dragstart="$emit('widget-dragstart', $event, widget, page)"
              @resizeStart="$emit('widget-resize-start', $event, widget, page)"
              @edit="$emit('widget-edit', widget, page.id)"
              @delete="$emit('widget-delete', widget, page.id)"
            />
          </AppErrorBoundary>
        </div>
      </PageContextMenu>
      
      <GridOverlay
        :rows="gridConfig.rows"
        :cols="gridConfig.cols"
        :snapping="gridConfig.snapping"
        :edit-mode="editMode"
        :page="page"
      />
    </div>
  </AppErrorBoundary>
</template>

<script setup lang="ts">
import type { WidgetInstance, WidgetPosition, Page } from '@/types'
import WidgetCard from '@/components/widgets/WidgetCard.vue'
import PageContextMenu from '@/components/widgets/PageContextMenu.vue'
import GridOverlay from '@/components/widgets/GridOverlay.vue'
import AppErrorBoundary from '@/components/common/AppErrorBoundary.vue'
import LoadingPlaceholder from '@/components/common/LoadingPlaceholder.vue'

type Props = {
  page: Page
  widgets: WidgetInstance[]
  editMode: boolean
  isLoadingWidgets?: boolean
  gridConfig: {
    rows: number
    cols: number
    snapping: boolean
  }
  tempPositions?: Record<number, WidgetPosition>
  draggingWidgetId?: number | null
}

defineProps<Props>()

defineEmits<{
  'add-widget': [pageId: number]
  'add-page': []
  'rename-page': [page: Page]
  'delete-page': [page: Page]
  'widget-dragstart': [event: MouseEvent | TouchEvent, widget: WidgetInstance, page: Page]
  'widget-resize-start': [event: MouseEvent | TouchEvent, widget: WidgetInstance, page: Page]
  'widget-edit': [widget: WidgetInstance, pageId: number]
  'widget-delete': [widget: WidgetInstance, pageId: number]
}>()
</script>

<style scoped>
.widget-loading-container {
  @apply absolute inset-0 p-8 space-y-4;
}

.widget-placeholder {
  @apply max-w-sm;
  position: absolute;
}

.widget-placeholder:nth-child(1) {
  top: 10%;
  left: 10%;
}

.widget-placeholder:nth-child(2) {
  top: 20%;
  right: 15%;
}

.widget-placeholder:nth-child(3) {
  bottom: 25%;
  left: 20%;
}
</style>