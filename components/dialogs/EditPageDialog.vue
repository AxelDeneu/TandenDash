<script setup lang="ts">
import { ref, watch } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import type { Page } from '@/types'

const props = defineProps<{
  open: boolean;
  page: Page | null;
}>();

const emit = defineEmits<{
  (e: 'edit', data: { name: string; snapping: boolean; gridRows: number; gridCols: number; marginTop: number; marginRight: number; marginBottom: number; marginLeft: number }): void;
  (e: 'close'): void;
}>();

// Local form state
const formData = ref({
  name: '',
  snapping: false,
  gridRows: 6,
  gridCols: 6,
  marginTop: 0,
  marginRight: 0,
  marginBottom: 0,
  marginLeft: 0
})

// Initialize form when dialog opens
watch(() => props.open, (isOpen) => {
  if (isOpen && props.page) {
    formData.value = {
      name: props.page.name,
      snapping: props.page.snapping || false,
      gridRows: props.page.gridRows || 6,
      gridCols: props.page.gridCols || 6,
      marginTop: props.page.marginTop || 0,
      marginRight: props.page.marginRight || 0,
      marginBottom: props.page.marginBottom || 0,
      marginLeft: props.page.marginLeft || 0
    }
  }
})

const handleSubmit = () => {
  emit('edit', { ...formData.value })
}
</script>

<template>
  <Dialog :open="props.open" @update:open="val => { if (!val) emit('close') }">
    <DialogContent v-if="props.page">
      <DialogHeader>
        <DialogTitle>{{ $t('dashboard.editPageSettings') }}</DialogTitle>
      </DialogHeader>
      <div class="sr-only">Dialog for editing page settings including name, grid snapping, and grid dimensions</div>
      
      <div class="space-y-4">
        <div>
          <Label for="page-name">{{ $t('pages.pageName') }}</Label>
          <Input 
            id="page-name"
            v-model="formData.name" 
            :placeholder="$t('pages.pageNamePlaceholder')" 
            class="mt-1"
          />
        </div>
        
        <div class="flex items-center gap-3">
          <Switch 
            id="page-snapping"
            v-model:model-value="formData.snapping"
          />
          <Label for="page-snapping">{{ $t('dashboard.enableSnapping') }}</Label>
        </div>
        
        <div v-if="formData.snapping" class="grid grid-cols-2 gap-3">
          <div>
            <Label for="grid-rows">{{ $t('dashboard.gridRows') }}</Label>
            <Input 
              id="grid-rows"
              v-model.number="formData.gridRows"
              type="number" 
              min="1" 
              max="20"
              class="mt-1"
            />
          </div>
          <div>
            <Label for="grid-cols">{{ $t('dashboard.gridColumns') }}</Label>
            <Input 
              id="grid-cols"
              v-model.number="formData.gridCols"
              type="number" 
              min="1" 
              max="20"
              class="mt-1"
            />
          </div>
        </div>

        <!-- Page Margins Section -->
        <div class="border-t pt-4">
          <h3 class="text-sm font-medium mb-3">{{ $t('dashboard.pageMargins') }}</h3>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <Label for="margin-top">{{ $t('dashboard.marginTop') }}</Label>
              <Input 
                id="margin-top"
                v-model.number="formData.marginTop"
                type="number" 
                min="0" 
                max="200"
                placeholder="0"
                class="mt-1"
              />
            </div>
            <div>
              <Label for="margin-right">{{ $t('dashboard.marginRight') }}</Label>
              <Input 
                id="margin-right"
                v-model.number="formData.marginRight"
                type="number" 
                min="0" 
                max="200"
                placeholder="0"
                class="mt-1"
              />
            </div>
            <div>
              <Label for="margin-bottom">{{ $t('dashboard.marginBottom') }}</Label>
              <Input 
                id="margin-bottom"
                v-model.number="formData.marginBottom"
                type="number" 
                min="0" 
                max="200"
                placeholder="0"
                class="mt-1"
              />
            </div>
            <div>
              <Label for="margin-left">{{ $t('dashboard.marginLeft') }}</Label>
              <Input 
                id="margin-left"
                v-model.number="formData.marginLeft"
                type="number" 
                min="0" 
                max="200"
                placeholder="0"
                class="mt-1"
              />
            </div>
          </div>
          <p class="text-xs text-muted-foreground mt-2">
            {{ $t('dashboard.marginDescription') }}
          </p>
        </div>
      </div>
      
      <DialogFooter class="mt-6">
        <DialogClose as-child>
          <Button variant="outline">{{ $t('common.cancel') }}</Button>
        </DialogClose>
        <Button @click="handleSubmit">{{ $t('common.save') }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>