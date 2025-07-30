import { defineApiHandler } from '../../utils/api-handler'
import { checkDatabaseHealth, getDatabaseStats } from '~/lib/db'
import { sendCachedResponse, withPerformanceMonitoring } from '~/server/utils/response'
import { healthResponseSchema } from '../../schemas'

export default defineApiHandler(async ({ event }) => {
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
    status: isHealthy ? 'ok' : 'error' as const,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version
  }

  // Validate response format
  const validatedData = healthResponseSchema.parse(healthData)

  return sendCachedResponse(event, validatedData, {
    ttl: 30, // 30 seconds
    staleWhileRevalidate: 60 // 1 minute
  })
})