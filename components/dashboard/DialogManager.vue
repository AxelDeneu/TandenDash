<template>
  <div class="dialog-manager">
    <!-- Add Widget Dialog -->
    <AppErrorBoundary 
      v-if="editMode && showAddWidget && addWidgetPageId !== null"
      fallback-message="Failed to load add widget dialog."
    >
      <AddWidgetDialog 
        :open="showAddWidget"
        :page-id="addWidgetPageId" 
        @close="$emit('close-add-widget')" 
        @widget-added="$emit('widget-added', $event)" 
      />
    </AppErrorBoundary>
    
    <!-- Edit Widget Dialog -->
    <AppErrorBoundary 
      v-if="editMode && showEditWidget && editWidgetInstance"
      fallback-message="Failed to load edit widget dialog."
    >
      <AddWidgetDialog 
        :open="showEditWidget"
        :page-id="editWidgetInstance.pageId" 
        :edit-widget="editWidgetInstance" 
        @close="$emit('close-edit-widget')"
        @widget-edited="$emit('widget-edited', $event)" 
        mode="edit" 
      />
    </AppErrorBoundary>
    
    <!-- Add Page Dialog -->
    <AppErrorBoundary fallback-message="Failed to load add page dialog.">
      <AddPageDialog
        :open="showAddPage"
        :new-page-name="newPageName"
        @update:new-page-name="$emit('update:newPageName', $event)"
        @add="$emit('add-page', $event)"
        @close="$emit('close-add-page')"
      />
    </AppErrorBoundary>
    
    <!-- Edit Page Dialog -->
    <AppErrorBoundary fallback-message="Failed to load edit page dialog.">
      <EditPageDialog
        :open="showRenamePage"
        :page="pageToEdit"
        @edit="$emit('edit-page', $event)"
        @close="$emit('close-edit-page')"
      />
    </AppErrorBoundary>
  </div>
</template>

<script setup lang="ts">
import type { WidgetInstance, Page } from '@/types'
import { defineAsyncComponent } from 'vue'
import AppErrorBoundary from '@/components/common/AppErrorBoundary.vue'

// Lazy-loaded dialog components
const AddWidgetDialog = defineAsyncComponent(() => import('@/components/widgets/AddWidgetDialog.vue'))
const AddPageDialog = defineAsyncComponent(() => import('@/components/dialogs/AddPageDialog.vue'))
const EditPageDialog = defineAsyncComponent(() => import('@/components/dialogs/EditPageDialog.vue'))

type Props = {
  editMode: boolean
  showAddWidget: boolean
  addWidgetPageId: number | null
  showEditWidget: boolean
  editWidgetInstance: WidgetInstance | null
  showAddPage: boolean
  newPageName: string
  showRenamePage: boolean
  pageToEdit: Page | null
}

defineProps<Props>()

defineEmits<{
  'close-add-widget': []
  'widget-added': [pageId: number]
  'close-edit-widget': []
  'widget-edited': [pageId: number]
  'close-add-page': []
  'add-page': []
  'close-edit-page': []
  'edit-page': [data: { name: string; snapping: boolean; gridRows: number; gridCols: number }]
  'update:newPageName': [value: string]
}>()
</script>