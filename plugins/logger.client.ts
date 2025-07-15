import { LoggerService } from '@/lib/services/LoggerService'
import type { ILoggerService } from '@/lib/services/interfaces'

export default defineNuxtPlugin(() => {
  // Create logger directly without using container to avoid database imports
  const logger = new LoggerService(process.dev ? 'debug' : 'info')
  
  return {
    provide: {
      logger
    }
  }
})

// Add type declaration for the global logger
declare module '#app' {
  interface NuxtApp {
    $logger: ILoggerService
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $logger: ILoggerService
  }
}