import { z } from 'zod'

export const healthResponseSchema = z.object({
  healthy: z.boolean(),
  stats: z.record(z.any()),
  status: z.enum(['ok', 'error']),
  uptime: z.number(),
  memory: z.object({
    rss: z.number(),
    heapTotal: z.number(),
    heapUsed: z.number(),
    external: z.number(),
    arrayBuffers: z.number()
  }),
  version: z.string()
})