<script setup lang="ts">
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuSub, ContextMenuSubTrigger, ContextMenuSubContent } from '@/components/ui/context-menu'
import type { Page } from '@/types'

type Props = {
  page: Page
  editMode: boolean
}

defineProps<Props>()

defineEmits<{
  'add-widget': [pageId: number]
  'add-page': []
  'rename-page': [page: Page]
  'delete-page': [page: Page]
}>()
</script>

<template>
  <ContextMenu class="relative z-[20]">
    <ContextMenuTrigger :disabled="!editMode">
      <slot />
    </ContextMenuTrigger>
    <ContextMenuContent>
      <ContextMenuSub>
        <ContextMenuSubTrigger inset data-testid="widgets-menu-trigger">
          {{ $t('contextMenu.widgets') }}
        </ContextMenuSubTrigger>
        <ContextMenuSubContent class="w-48">
          <ContextMenuItem @click="() => $emit('add-widget', page.id)" data-testid="add-widget-menu">{{ $t('contextMenu.addWidget') }}</ContextMenuItem>
        </ContextMenuSubContent>
      </ContextMenuSub>
      <ContextMenuSub>
        <ContextMenuSubTrigger inset data-testid="pages-menu-trigger">
          {{ $t('contextMenu.pages') }}
        </ContextMenuSubTrigger>
        <ContextMenuSubContent class="w-48">
          <ContextMenuItem @click="() => $emit('add-page')" data-testid="add-page-menu">{{ $t('contextMenu.addPage') }}</ContextMenuItem>
          <ContextMenuItem @click="() => $emit('rename-page', page)" data-testid="rename-page-menu">{{ $t('contextMenu.renamePage') }}</ContextMenuItem>
          <ContextMenuItem @click="() => $emit('delete-page', page)" data-testid="delete-page-menu">{{ $t('contextMenu.deletePage') }}</ContextMenuItem>
        </ContextMenuSubContent>
      </ContextMenuSub>
    </ContextMenuContent>
  </ContextMenu>
</template> 