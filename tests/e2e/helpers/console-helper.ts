import { Page } from '@playwright/test'

export interface ConsoleError {
  text: string
  location?: string
  timestamp: Date
}

export function setupConsoleErrorCapture(page: Page) {
  const errors: ConsoleError[] = []
  
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push({
        text: msg.text(),
        location: msg.location()?.url,
        timestamp: new Date()
      })
    }
  })
  
  return {
    getErrors: () => [...errors],
    hasErrors: () => errors.length > 0,
    clearErrors: () => errors.length = 0,
    getErrorCount: () => errors.length,
    getLastError: () => errors[errors.length - 1] || null
  }
}

export function ignoreKnownErrors(errors: ConsoleError[]): ConsoleError[] {
  // Filtrer les erreurs connues et acceptables
  const knownErrorPatterns: RegExp[] = [
    // Ajouter ici des patterns d'erreurs connues à ignorer si nécessaire
    // Par exemple: /Failed to load resource.*favicon/
  ]
  
  return errors.filter(error => {
    return !knownErrorPatterns.some(pattern => pattern.test(error.text))
  })
}