<script setup lang="ts">
import { ref, watch } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const props = defineProps<{
  open: boolean;
  newPageName: string;
}>();
const emit = defineEmits<{
  (e: 'add'): void;
  (e: 'close'): void;
  (e: 'update:newPageName', value: string): void;
}>();

// Local state that syncs with prop
const localPageName = ref(props.newPageName)

// Watch for prop changes and update local state
watch(() => props.newPageName, (newValue) => {
  localPageName.value = newValue
})

// Emit update when local value changes
const updatePageName = (value: string) => {
  localPageName.value = value
  emit('update:newPageName', value)
}
</script>

<template>
  <Dialog :open="props.open" @update:open="val => { if (!val) emit('close') }">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ $t('dashboard.addPage') }}</DialogTitle>
      </DialogHeader>
      <Input :model-value="localPageName" @update:model-value="updatePageName" :placeholder="$t('pages.pageNamePlaceholder')" class="mb-4" />
      <DialogFooter>
        <Button @click="() => emit('add')">{{ $t('common.add') }}</Button>
        <DialogClose as-child><Button variant="secondary">{{ $t('common.cancel') }}</Button></DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template> 