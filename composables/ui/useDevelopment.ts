import { ref, readonly } from 'vue'

export interface UseDevelopment {
  isDevelopment: Readonly<boolean>
}

export function useDevelopment(): UseDevelopment {
  // In Nuxt, process.dev is available to check if we're in development mode
  const isDevelopment = ref(process.dev === true)

  return {
    isDevelopment: readonly(isDevelopment).value
  }
}