<template>
  <div 
    class="h-full w-full overflow-auto transition-all duration-200 relative"
    :class="[
      backgroundColor,
      textColor,
      fontFamily,
      showBorder ? `border-${borderWidth} ${borderColor}` : '',
      getShadowClass(),
      !isEditing && 'cursor-pointer hover:opacity-90'
    ]"
    :style="{
      padding: `${padding}px`,
      borderRadius: `${borderRadius}px`,
      fontSize: `${fontSize}px`,
      lineHeight: lineHeight,
      textAlign: textAlign
    }"
    @click="handleClick"
  >
    <!-- Display mode -->
    <div v-if="!isEditing" class="whitespace-pre-wrap break-words relative">
      <template v-if="enableMarkdown">
        <!-- Simple markdown rendering (basic support) -->
        <div v-html="renderMarkdown(displayContent)" />
      </template>
      <template v-else>
        {{ displayContent || 'Tap to add your note...' }}
      </template>
      <!-- Touch indicator -->
      <div v-if="!displayContent" class="absolute bottom-0 right-0 opacity-50">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </div>
    </div>
    
    <!-- Edit mode -->
    <div v-else class="h-full flex flex-col">
      <textarea
        ref="textareaRef"
        v-model="editableContent"
        class="flex-1 w-full resize-none outline-none bg-transparent"
        :style="{
          fontSize: `${fontSize}px`,
          lineHeight: lineHeight,
          textAlign: textAlign
        }"
        placeholder="Enter your note..."
        @blur="handleBlur"
        @keydown="handleKeydown"
        @click.stop
      />
      <div class="flex gap-2 mt-2 justify-end">
        <button
          class="px-4 py-2 text-base rounded-md bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-transform"
          @click.stop="saveContent"
        >
          Save
        </button>
        <button
          class="px-4 py-2 text-base rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90 active:scale-95 transition-transform"
          @click.stop="cancelEdit"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import type { NoteWidgetConfig } from './definition'
import { useWidgetOperations } from '@/composables/data/useWidgetOperations'

const props = defineProps<NoteWidgetConfig & { id?: number }>()

// State for direct editing
const isEditing = ref(false)
const editableContent = ref('')
const textareaRef = ref<HTMLTextAreaElement>()

// Local display state for immediate feedback
const displayContent = ref(props.content || '')

// Get widget operations
const { updateWidget } = useWidgetOperations()

// Watch for external content updates
watch(() => props.content, (newContent) => {
  displayContent.value = newContent || ''
})

// Helper to get shadow class
const getShadowClass = () => {
  const shadowMap = {
    'none': '',
    'sm': 'shadow-sm',
    'md': 'shadow-md',
    'lg': 'shadow-lg',
    'xl': 'shadow-xl'
  }
  return shadowMap[props.shadowStyle] || ''
}

// Simple markdown renderer (very basic - just handles bold, italic, and line breaks)
const renderMarkdown = (text: string) => {
  if (!text) return ''
  
  return text
    // Bold: **text** or __text__
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    // Italic: *text* or _text_
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    // Line breaks
    .replace(/\n/g, '<br>')
    // Headers (basic)
    .replace(/^### (.*?)$/gm, '<h3 class="text-lg font-semibold mb-2">$1</h3>')
    .replace(/^## (.*?)$/gm, '<h2 class="text-xl font-bold mb-2">$1</h2>')
    .replace(/^# (.*?)$/gm, '<h1 class="text-2xl font-bold mb-3">$1</h1>')
    // Lists (basic)
    .replace(/^- (.*?)$/gm, '<li class="ml-4">$1</li>')
    .replace(/^(\d+)\. (.*?)$/gm, '<li class="ml-4" style="list-style-type: decimal">$2</li>')
}

// Enter edit mode
const handleClick = () => {
  if (!isEditing.value) {
    isEditing.value = true
    editableContent.value = displayContent.value || ''
    nextTick(() => {
      textareaRef.value?.focus()
      textareaRef.value?.select()
    })
  }
}

// Save content
const saveContent = async () => {
  if (editableContent.value === displayContent.value) {
    isEditing.value = false
    return
  }

  if (!props.id) {
    console.error('Cannot save: widget ID is missing')
    return
  }

  try {
    await updateWidget({
      id: props.id,
      options: {
        content: editableContent.value,
        fontSize: props.fontSize,
        fontFamily: props.fontFamily,
        textColor: props.textColor,
        backgroundColor: props.backgroundColor,
        padding: props.padding,
        borderRadius: props.borderRadius,
        showBorder: props.showBorder,
        borderColor: props.borderColor,
        borderWidth: props.borderWidth,
        textAlign: props.textAlign,
        enableMarkdown: props.enableMarkdown,
        shadowStyle: props.shadowStyle,
        lineHeight: props.lineHeight,
        minWidth: props.minWidth,
        minHeight: props.minHeight
      }
    })
    // Update display content immediately for instant feedback
    displayContent.value = editableContent.value
    isEditing.value = false
  } catch (error) {
    console.error('Failed to save note:', error)
    // Keep editing mode open on error
  }
}

// Cancel editing
const cancelEdit = () => {
  isEditing.value = false
  editableContent.value = ''
}

// Handle blur event
const handleBlur = (event: FocusEvent) => {
  // Don't save on blur if clicking a button
  const relatedTarget = event.relatedTarget as HTMLElement
  if (relatedTarget && (relatedTarget.tagName === 'BUTTON')) {
    return
  }
  
  // Small delay to allow button clicks to register
  setTimeout(() => {
    if (isEditing.value) {
      saveContent()
    }
  }, 200)
}

// Handle keyboard shortcuts
const handleKeydown = (event: KeyboardEvent) => {
  // Save on Ctrl/Cmd + Enter
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault()
    saveContent()
  }
  
  // Cancel on Escape
  if (event.key === 'Escape') {
    event.preventDefault()
    cancelEdit()
  }
}
</script>