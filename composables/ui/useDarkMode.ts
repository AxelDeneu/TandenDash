import { ref, computed, type Ref, type ComputedRef } from 'vue'

export interface UseDarkMode {
  isDark: ComputedRef<boolean>
  mode: Ref<'light' | 'dark'>
  
  toggleMode(): Promise<void>
  setMode(newMode: 'light' | 'dark'): Promise<void>
  initializeMode(): Promise<void>
}

export function useDarkMode(): UseDarkMode {
  const mode = ref<'light' | 'dark'>('light')
  
  const isDark = computed(() => mode.value === 'dark')
  
  async function setHtmlMode(newMode: 'light' | 'dark'): Promise<void> {
    const html = document.documentElement
    if (newMode === 'dark') {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
    mode.value = newMode
  }
  
  async function setMode(newMode: 'light' | 'dark'): Promise<void> {
    await setHtmlMode(newMode)
    await $fetch('/api/mode-state', {
      method: 'POST',
      body: { mode: newMode }
    })
  }
  
  async function toggleMode(): Promise<void> {
    const newMode = mode.value === 'dark' ? 'light' : 'dark'
    await setMode(newMode)
  }
  
  async function initializeMode(): Promise<void> {
    try {
      const data = await $fetch<{ mode: 'light' | 'dark' }>('/api/mode-state')
      await setHtmlMode(data.mode)
    } catch {
      await setHtmlMode('light')
    }
  }
  
  return {
    isDark,
    mode,
    toggleMode,
    setMode,
    initializeMode
  }
}