import { ref, readonly } from 'vue'
import type { DialogState } from './interfaces'

export function useDialogState<TData = unknown>(): DialogState & {
  toggle(): void
  reset(): void
} {
  const isOpen = ref(false)
  const data = ref<TData | null>(null)

  function open(initialData?: TData): void {
    if (initialData !== undefined) {
      data.value = initialData
    }
    isOpen.value = true
  }

  function close(): void {
    isOpen.value = false
  }

  function toggle(): void {
    isOpen.value = !isOpen.value
  }

  function setData(newData: TData): void {
    data.value = newData
  }

  function reset(): void {
    isOpen.value = false
    data.value = null
  }

  return {
    isOpen: readonly(isOpen),
    data: readonly(data),
    open,
    close,
    toggle,
    setData,
    reset
  }
}