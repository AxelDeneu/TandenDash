import type { WidgetApiRoute } from '@/lib/widgets/api-routes'

// Routes API pour le widget Calendar
export const apiRoutes: WidgetApiRoute[] = [
  {
    method: 'POST',
    path: 'proxy',
    handler: 'handlers/proxy.ts'
  },
  {
    method: 'POST',
    path: 'caldav-sync',
    handler: 'handlers/caldav-sync.ts'
  },
  {
    method: 'POST',
    path: 'caldav-test',
    handler: 'handlers/caldav-test.ts'
  }
]