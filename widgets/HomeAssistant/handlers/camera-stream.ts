import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import WebSocket from 'ws'

// Schema for camera stream request
const CameraStreamRequestSchema = z.object({
  entityId: z.string().min(1),
  instanceUrl: z.string().url(),
  accessToken: z.string().min(1)
})

// Helper function to try camera_stream webhook
async function tryWebhookStream(baseUrl: string, entityId: string, accessToken: string) {
  console.log('[Camera Stream] Trying camera_stream webhook')
  
  try {
    // The webhook endpoint requires a webhook ID, but we can try the mobile_app webhook
    // Note: This might need adjustment based on your Home Assistant setup
    const webhookUrl = `${baseUrl}/api/webhook/mobile_app_stream`
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'stream_camera',
        data: {
          camera_entity_id: entityId
        }
      })
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('[Camera Stream] Webhook response:', data)
      
      if (data.hls_path) {
        // Construct full HLS URL
        const hlsUrl = `${baseUrl}${data.hls_path}`
        return {
          streamUrl: hlsUrl,
          streamType: 'hls',
          contentType: 'application/vnd.apple.mpegurl',
          requiresAuth: false
        }
      }
    }
  } catch (err) {
    console.error('[Camera Stream] Webhook failed:', err)
  }
  
  return null
}

// Helper function to try WebSocket approach
async function tryWebSocketStream(baseUrl: string, entityId: string, accessToken: string) {
  console.log('[Camera Stream] Trying WebSocket camera/stream command')
  
  try {
    // Create WebSocket connection
    const wsUrl = baseUrl.replace(/^http/, 'ws') + '/api/websocket'
    const ws = new WebSocket(wsUrl)
    
    return new Promise((resolve) => {
      let messageId = 1
      let authenticated = false
      
      ws.onopen = () => {
        console.log('[Camera Stream] WebSocket connected')
      }
      
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data)
        
        if (message.type === 'auth_required') {
          // Send authentication
          ws.send(JSON.stringify({
            type: 'auth',
            access_token: accessToken
          }))
        } else if (message.type === 'auth_ok') {
          authenticated = true
          // Request camera stream
          ws.send(JSON.stringify({
            id: messageId++,
            type: 'camera/stream',
            entity_id: entityId
          }))
        } else if (message.type === 'result' && message.success) {
          // Got stream URL
          console.log('[Camera Stream] WebSocket result:', message.result)
          ws.close()
          
          if (message.result && message.result.url) {
            // Ensure URL is absolute
            let streamUrl = message.result.url
            if (streamUrl.startsWith('/')) {
              streamUrl = `${baseUrl}${streamUrl}`
            }
            
            resolve({
              streamUrl,
              streamType: 'hls',
              contentType: 'application/vnd.apple.mpegurl',
              requiresAuth: false
            })
          } else {
            resolve(null)
          }
        } else if (message.type === 'result' && !message.success) {
          console.error('[Camera Stream] WebSocket command failed:', message.error)
          ws.close()
          resolve(null)
        }
      }
      
      ws.onerror = (error) => {
        console.error('[Camera Stream] WebSocket error:', error)
        ws.close()
        resolve(null)
      }
      
      // Timeout after 5 seconds
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close()
        }
        resolve(null)
      }, 5000)
    })
  } catch (err) {
    console.error('[Camera Stream] WebSocket approach failed:', err)
    return null
  }
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    
    // Validate request
    const validation = CameraStreamRequestSchema.safeParse(body)
    if (!validation.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid request parameters',
        data: validation.error.errors
      })
    }
    
    const { entityId, instanceUrl, accessToken } = validation.data
    const baseUrl = instanceUrl.replace(/\/$/, '')
    
    // Try different methods to get the stream URL
    
    // Method 1: Try webhook approach
    const webhookResult = await tryWebhookStream(baseUrl, entityId, accessToken)
    if (webhookResult) {
      console.log('[Camera Stream] Success with webhook approach')
      return webhookResult
    }
    
    // Method 2: Try WebSocket approach
    const wsResult = await tryWebSocketStream(baseUrl, entityId, accessToken)
    if (wsResult) {
      console.log('[Camera Stream] Success with WebSocket approach')
      return wsResult
    }
    
    // Method 3: Try camera_stream_source API
    console.log('[Camera Stream] Trying camera_stream_source API')
    const streamSourceUrl = `${baseUrl}/api/camera_stream_source/${entityId}`
    
    const response = await fetch(streamSourceUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'text/plain'
      }
    })
    
    if (response.ok) {
      let streamUrl = await response.text()
      streamUrl = streamUrl.trim()
      console.log('[Camera Stream] Got stream source URL:', streamUrl)
      
      // Ensure URL is absolute
      if (streamUrl.startsWith('/')) {
        streamUrl = `${baseUrl}${streamUrl}`
      }
      
      // Determine stream type
      let streamType = 'unknown'
      let contentType = 'video/mp4'
      
      if (streamUrl.includes('.m3u8') || streamUrl.includes('playlist')) {
        streamType = 'hls'
        contentType = 'application/vnd.apple.mpegurl'
      } else if (streamUrl.startsWith('rtsp://')) {
        streamType = 'rtsp'
        contentType = 'application/x-rtsp'
      }
      
      return {
        streamUrl,
        streamType,
        contentType,
        requiresAuth: false
      }
    }
    
    // Method 4: Final fallback - construct HLS URL manually
    console.log('[Camera Stream] All methods failed, constructing HLS URL manually')
    
    // This is a last resort - the URL structure might not work
    const fallbackHlsUrl = `${baseUrl}/api/camera_proxy_stream/${entityId}`
    
    return {
      streamUrl: fallbackHlsUrl,
      streamType: 'hls',
      contentType: 'application/vnd.apple.mpegurl',
      requiresAuth: true,
      accessToken: accessToken
    }
    
  } catch (error) {
    console.error('[Camera Stream] Error:', error)
    
    if (error instanceof Error) {
      throw createError({
        statusCode: 500,
        statusMessage: error.message
      })
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to access camera stream'
    })
  }
})