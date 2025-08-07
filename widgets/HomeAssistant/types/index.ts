export interface HassEntity {
  entity_id: string
  state: string
  attributes: Record<string, any>
  last_changed: string
  last_updated: string
  context: {
    id: string
    parent_id: string | null
    user_id: string | null
  }
}

export interface HassService {
  domain: string
  service: string
  target?: {
    entity_id?: string | string[]
    device_id?: string | string[]
    area_id?: string | string[]
  }
  service_data?: Record<string, any>
}

export interface HassConfig {
  latitude: number
  longitude: number
  elevation: number
  unit_system: {
    length: string
    mass: string
    temperature: string
    volume: string
  }
  location_name: string
  time_zone: string
  components: string[]
  version: string
}

export interface HassUser {
  id: string
  name: string
  is_owner: boolean
  is_admin: boolean
}

export interface HassStateChangedEvent {
  event_type: 'state_changed'
  data: {
    entity_id: string
    old_state: HassEntity | null
    new_state: HassEntity | null
  }
  origin: string
  time_fired: string
  context: {
    id: string
    parent_id: string | null
    user_id: string | null
  }
}

export interface ConnectionOptions {
  useWebSocket?: boolean
  reconnectInterval?: number
  autoConnect?: boolean
}

export interface HomeAssistantError extends Error {
  code?: string
  statusCode?: number
  data?: any
}