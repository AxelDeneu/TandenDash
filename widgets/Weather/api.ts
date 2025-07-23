import type { WidgetApiRoute } from '@/lib/widgets/api-routes'

// API Routes for weather widget
export const apiRoutes: WidgetApiRoute[] = [
  {
    method: 'GET',
    path: 'current',
    handler: 'handlers/current.ts'
  }
]