import type { H3Event } from 'h3'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

export interface WidgetApiRoute {
  method: HttpMethod
  path: string
  handler: string // Path to the handler file relative to widget directory
}