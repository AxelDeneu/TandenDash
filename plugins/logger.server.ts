import { container } from '@/lib/di/container'
import type { ILoggerService } from '@/lib/services/interfaces'

export default defineNuxtPlugin(() => {
  const logger = container.getServiceFactory().createLoggerService()
  
  // Set development log level if in dev mode
  if (process.dev) {
    logger.setLogLevel('debug')
  }
  
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