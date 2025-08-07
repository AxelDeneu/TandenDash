import { vi } from 'vitest'
import { mockRouter, mockNuxtApp } from './nuxt'

// Mock Nuxt's #app module
export const useRouter = vi.fn(() => mockRouter)
export const useRoute = vi.fn(() => mockRouter.currentRoute.value)
export const useNuxtApp = vi.fn(() => mockNuxtApp)
export const navigateTo = vi.fn()
export const createError = vi.fn()
export const showError = vi.fn()