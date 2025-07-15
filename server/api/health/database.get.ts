import { checkDatabaseHealth, getDatabaseStats } from '~/lib/db'
import { sendCachedResponse, handleApiError, withPerformanceMonitoring } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  try {
    const [isHealthy, stats] = await withPerformanceMonitoring(
      () => Promise.all([
        checkDatabaseHealth(),
        getDatabaseStats()
      ]),
      'database-health-check'
    )

    const healthData = {
      healthy: isHealthy,
      stats: stats || {},
      status: isHealthy ? 'ok' : 'error',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version
    }

    return sendCachedResponse(event, healthData, {
      ttl: 30, // 30 seconds
      staleWhileRevalidate: 60 // 1 minute
    })
  } catch (error) {
    handleApiError(event, error as Error, 503, {
      details: { service: 'database' }
    })
  }
})