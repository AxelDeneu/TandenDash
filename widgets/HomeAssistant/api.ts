import type { WidgetApiRoute } from '@/lib/widgets/api-routes'

// API Routes for HomeAssistant widget
export const apiRoutes: WidgetApiRoute[] = [
  {
    method: 'POST',
    path: 'camera-stream',
    handler: 'handlers/camera-stream.ts'
  }
]

export default apiRoutes