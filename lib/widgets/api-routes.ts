import type { H3Event } from 'h3'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

export interface WidgetApiRoute {
  method: HttpMethod
  path: string
  handler: (event: H3Event) => Promise<any> | any
}