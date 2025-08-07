import { ref, computed, reactive } from 'vue'
import { 
  createConnection,
  createLongLivedTokenAuth,
  subscribeEntities,
  callService,
  type Connection,
  type HassEntities,
  type HassEntity
} from 'home-assistant-js-websocket'

export interface HomeAssistantConfig {
  instanceUrl: string
  accessToken: string
}

export interface HomeAssistantState {
  isConnected: boolean
  isConnecting: boolean
  entities: HassEntities
  error: Error | null
}

export function useHomeAssistant() {
  // State
  const state = reactive<HomeAssistantState>({
    isConnected: false,
    isConnecting: false,
    entities: {},
    error: null
  })
  
  // Connection reference
  let connection: Connection | null = null
  let unsubscribeEntities: (() => void) | null = null
  
  // Connect to Home Assistant
  const connect = async (config: HomeAssistantConfig) => {
    if (state.isConnecting) return
    
    state.isConnecting = true
    state.error = null
    
    try {
      // Disconnect if already connected
      if (connection) {
        await disconnect()
      }
      
      // Create auth
      const auth = createLongLivedTokenAuth(
        config.instanceUrl,
        config.accessToken
      )
      
      // Create connection
      connection = await createConnection({ auth })
      
      // Subscribe to entities
      unsubscribeEntities = subscribeEntities(connection, (entities) => {
        state.entities = entities
      })
      
      state.isConnected = true
    } catch (error) {
      state.error = error instanceof Error ? error : new Error(String(error))
      throw state.error
    } finally {
      state.isConnecting = false
    }
  }
  
  // Disconnect from Home Assistant
  const disconnect = async () => {
    if (unsubscribeEntities) {
      unsubscribeEntities()
      unsubscribeEntities = null
    }
    
    if (connection) {
      connection.close()
      connection = null
    }
    
    state.isConnected = false
    state.entities = {}
    state.error = null
  }
  
  // Get a specific entity
  const getEntity = (entityId: string): HassEntity | null => {
    return state.entities[entityId] || null
  }
  
  // Call a service
  const callHomeAssistantService = async (
    domain: string,
    service: string,
    data?: Record<string, any>
  ) => {
    console.log('[HomeAssistant] Calling service:', { domain, service, data })
    
    if (!connection) {
      console.error('[HomeAssistant] No connection available')
      throw new Error('Not connected to Home Assistant')
    }
    
    try {
      console.log('[HomeAssistant] Sending service call to HA')
      await callService(connection, domain, service, data)
      console.log('[HomeAssistant] Service call successful')
    } catch (error) {
      console.error('[HomeAssistant] Service call failed:', error)
      state.error = error instanceof Error ? error : new Error(String(error))
      throw state.error
    }
  }
  
  // Computed
  const entityList = computed(() => Object.values(state.entities))
  const entityCount = computed(() => Object.keys(state.entities).length)
  
  // Get camera stream URL
  const getCameraStreamUrl = (entityId: string): string => {
    if (!connection) {
      throw new Error('Not connected to Home Assistant')
    }
    
    const baseUrl = connection.options.auth?.data.hassUrl || ''
    const accessToken = connection.options.auth?.data.access_token || ''
    
    return `${baseUrl}/api/camera_proxy_stream/${entityId}?token=${accessToken}`
  }
  
  // Get camera snapshot URL
  const getCameraSnapshotUrl = (entityId: string): string => {
    if (!connection) {
      throw new Error('Not connected to Home Assistant')
    }
    
    const baseUrl = connection.options.auth?.data.hassUrl || ''
    const accessToken = connection.options.auth?.data.access_token || ''
    
    return `${baseUrl}/api/camera_proxy/${entityId}?token=${accessToken}`
  }
  
  // Generate access token for camera URLs
  const generateCameraToken = async (): Promise<string> => {
    if (!connection) {
      throw new Error('Not connected to Home Assistant')
    }
    
    // In a real implementation, this would call a service to generate a temporary token
    // For now, we return the existing access token
    return connection.options.auth?.data.access_token || ''
  }
  
  return {
    // State
    state: computed(() => state),
    isConnected: computed(() => state.isConnected),
    isConnecting: computed(() => state.isConnecting),
    entities: computed(() => state.entities),
    error: computed(() => state.error),
    
    // Computed
    entityList,
    entityCount,
    
    // Methods
    connect,
    disconnect,
    getEntity,
    callService: callHomeAssistantService,
    getCameraStreamUrl,
    getCameraSnapshotUrl,
    generateCameraToken
  }
}