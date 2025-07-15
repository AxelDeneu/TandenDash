<template>
  <!-- Edit Mode Toggle - Hidden on touch devices -->
  <LoadingButton 
    class="fixed top-4 right-4 z-50 hidden lg:flex" 
    @click="$emit('toggle-edit-mode')"
    variant="outline"
    :loading="isLoading"
  >
    {{ editMode ? 'Exit Edit' : 'Edit Mode' }}
  </LoadingButton>
</template>

<script setup lang="ts">
import LoadingButton from '@/components/common/LoadingButton.vue'

type Props = {
  editMode: boolean
  currentPageId: number
  widgetCount: number
  isLoading?: boolean
}

defineProps<Props>()

defineEmits<{
  'toggle-edit-mode': []
}>()
</script>