<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { HassEntity } from 'home-assistant-js-websocket'
import Hls from 'hls.js'
import { 
  Camera,
  Maximize,
  Activity,
  ActivitySquare,
  RefreshCw,
  X,
  Volume2,
  VolumeX
} from 'lucide-vue-next'
import { WidgetPlugin } from '../plugin'

// i18n
const { t } = useWidgetI18n(WidgetPlugin.id)

const props = defineProps<{
  entity: HassEntity
  instanceUrl: string
  accessToken: string
  allowControl?: boolean
  showCameraControls?: boolean
}>()

const emit = defineEmits<{
  'service-call': [domain: string, service: string, data?: Record<string, any>]
}>()

// Refs
const videoRef = ref<HTMLVideoElement>()
const isPageFullscreen = ref(false)
const isMuted = ref(true)
const streamUrl = ref('')
const isLoading = ref(true)
const error = ref<string | null>(null)

// HLS instance
let hlsInstance: Hls | null = null

// Camera state
const cameraState = computed(() => {
  const state = props.entity.state
  if (state === 'streaming') return t('camera.states.streaming')
  if (state === 'recording') return t('camera.states.recording')
  if (state === 'idle') return t('camera.states.idle')
  if (state === 'unavailable') return t('states.unavailable')
  return t('states.unknown')
})

// Check if motion detection is enabled
const isMotionDetectionEnabled = computed(() => {
  return props.entity.attributes.motion_detection || false
})

// Stream configuration
const streamConfig = ref<{
  streamUrl: string
  streamType: string
  requiresAuth: boolean
  accessToken?: string
} | null>(null)

// Fetch stream URL from proxy
const fetchStreamUrl = async () => {
  console.log('[CameraRenderer] Fetching stream URL via proxy')
  
  try {
    const response = await fetch('/api/widgets/homeassistant/camera-stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        entityId: props.entity.entity_id,
        instanceUrl: props.instanceUrl,
        accessToken: props.accessToken
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    streamConfig.value = data
    streamUrl.value = data.streamUrl
    
    console.log('[CameraRenderer] Full response data:', data)
    console.log('[CameraRenderer] Stream URL fetched:', streamUrl.value)
    console.log('[CameraRenderer] Stream type:', data.streamType)
    console.log('[CameraRenderer] Requires auth:', data.requiresAuth)
    
    // Additional validation
    if (streamUrl.value && streamUrl.value.startsWith('/')) {
      console.warn('[CameraRenderer] WARNING: Received relative URL, this might cause issues!')
      console.warn('[CameraRenderer] Instance URL:', props.instanceUrl)
    }
    
    // Setup stream based on type
    if (data.streamType === 'hls') {
      await setupHlsStream()
    } else if (data.streamType === 'mp4' || data.streamType === 'webm') {
      // For direct video files, just set the source
      setupDirectStream()
    } else {
      console.error('[CameraRenderer] Unsupported stream type:', data.streamType)
      error.value = t('camera.errors.streamFailed')
      isLoading.value = false
    }
    
  } catch (err) {
    console.error('[CameraRenderer] Failed to fetch stream URL:', err)
    error.value = t('camera.errors.streamFailed')
    isLoading.value = false
  }
}

// Setup direct video stream (MP4, WebM, etc.)
const setupDirectStream = () => {
  if (!videoRef.value || !streamUrl.value) {
    console.error('[CameraRenderer] Missing video ref or stream URL')
    return
  }
  
  console.log('[CameraRenderer] Setting up direct video stream')
  videoRef.value.src = streamUrl.value
  // Direct streams usually load faster, so we can hide loading sooner
  videoRef.value.onloadedmetadata = () => {
    isLoading.value = false
    error.value = null
  }
}

// Setup HLS stream
const setupHlsStream = async () => {
  if (!videoRef.value || !streamUrl.value) {
    console.error('[CameraRenderer] Missing video ref or stream URL')
    return
  }
  
  try {
    // Configure HLS options with authentication if needed
    const hlsConfig: Partial<Hls.Config> = {
      debug: false,
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 90
    }
    
    // Extract base URL from stream URL
    const streamUrlObj = new URL(streamUrl.value)
    const baseUrl = `${streamUrlObj.protocol}//${streamUrlObj.host}`
    
    // Configure loader to handle relative URLs properly
    hlsConfig.loader = class CustomLoader extends Hls.DefaultConfig.loader {
      load(context: any, config: any, callbacks: any) {
        // If URL is relative, make it absolute using the Home Assistant base URL
        if (context.url.startsWith('/')) {
          context.url = `${baseUrl}${context.url}`
          console.log('[CameraRenderer] Rewriting relative URL to:', context.url)
        }
        super.load(context, config, callbacks)
      }
    }
    
    // If authentication is required, add headers
    if (streamConfig.value?.requiresAuth && streamConfig.value.accessToken) {
      hlsConfig.xhrSetup = (xhr: XMLHttpRequest, url: string) => {
        xhr.setRequestHeader('Authorization', `Bearer ${streamConfig.value!.accessToken}`)
        console.log('[CameraRenderer] Adding auth header for:', url)
      }
    }
    
    // Check if browser supports HLS natively (Safari)
    if (videoRef.value.canPlayType('application/vnd.apple.mpegurl')) {
      console.log('[CameraRenderer] Browser supports HLS natively')
      videoRef.value.src = streamUrl.value
      await videoRef.value.play()
    } else if (Hls.isSupported()) {
      console.log('[CameraRenderer] Using HLS.js for stream playback')
      
      // Create HLS instance with config
      hlsInstance = new Hls(hlsConfig)
      
      // Attach to video element
      hlsInstance.attachMedia(videoRef.value)
      
      // Load source
      hlsInstance.loadSource(streamUrl.value)
      
      // Handle manifest parsed
      hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('[CameraRenderer] HLS manifest parsed, starting playback')
        videoRef.value?.play()
        isLoading.value = false
        error.value = null
      })
      
      // Handle errors
      hlsInstance.on(Hls.Events.ERROR, (event, data) => {
        console.error('[CameraRenderer] HLS error:', data)
        
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('[CameraRenderer] Fatal network error, trying to recover')
              hlsInstance?.startLoad()
              break
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('[CameraRenderer] Fatal media error, trying to recover')
              hlsInstance?.recoverMediaError()
              break
            default:
              console.error('[CameraRenderer] Fatal error, cannot recover')
              error.value = t('camera.errors.streamFailed')
              isLoading.value = false
              cleanupHls()
              break
          }
        }
      })
    } else {
      console.error('[CameraRenderer] HLS is not supported in this browser')
      error.value = t('camera.errors.streamFailed')
      isLoading.value = false
    }
  } catch (err) {
    console.error('[CameraRenderer] Error setting up HLS stream:', err)
    error.value = t('camera.errors.streamFailed')
    isLoading.value = false
  }
}

// Cleanup HLS
const cleanupHls = () => {
  if (hlsInstance) {
    console.log('[CameraRenderer] Cleaning up HLS instance')
    hlsInstance.destroy()
    hlsInstance = null
  }
}


// Toggle page fullscreen
const toggleFullscreen = () => {
  isPageFullscreen.value = !isPageFullscreen.value
}

// Exit fullscreen
const exitFullscreen = () => {
  isPageFullscreen.value = false
}

// Toggle audio mute
const toggleMute = () => {
  if (videoRef.value) {
    isMuted.value = !isMuted.value
    videoRef.value.muted = isMuted.value
  }
}


// Toggle motion detection
const toggleMotionDetection = async () => {
  const service = isMotionDetectionEnabled.value 
    ? 'disable_motion_detection' 
    : 'enable_motion_detection'
  
  await emit('service-call', 'camera', service, {
    entity_id: props.entity.entity_id
  })
}

// Start recording
const startRecording = async () => {
  await emit('service-call', 'camera', 'record', {
    entity_id: props.entity.entity_id,
    duration: 30 // Default 30 seconds
  })
}

// Handle video load
const handleVideoLoad = () => {
  console.log('[CameraRenderer] Video stream loaded successfully')
  isLoading.value = false
  error.value = null
}

// Handle video error
const handleVideoError = (e: Event) => {
  console.error('[CameraRenderer] Video stream error:', e)
  isLoading.value = false
  error.value = t('camera.errors.streamFailed')
}

// Watch for entity changes
watch(() => props.entity, async () => {
  cleanupHls()
  await fetchStreamUrl()
})

// Lifecycle
onMounted(async () => {
  console.log('[CameraRenderer] Component mounted')
  console.log('[CameraRenderer] Entity:', props.entity)
  
  // Fetch stream URL and setup HLS
  await fetchStreamUrl()
  
})

onUnmounted(() => {
  cleanupHls()
})
</script>

<template>
  <div class="space-y-4">
    <!-- Camera header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <Camera class="w-6 h-6 text-muted-foreground" />
        <div>
          <div class="font-medium">
            {{ entity.attributes.friendly_name || entity.entity_id.split('.')[1] }}
          </div>
          <Badge variant="secondary" class="text-xs">
            {{ cameraState }}
          </Badge>
        </div>
      </div>
    </div>
    
    <!-- Camera view container -->
    <Teleport to="body" :disabled="!isPageFullscreen">
      <div 
        class="relative bg-black overflow-hidden"
        :class="isPageFullscreen ? 'fullscreen-wrapper' : 'rounded-lg aspect-video'"
      >
        <!-- Loading state -->
        <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center">
          <RefreshCw class="w-8 h-8 text-white animate-spin" />
        </div>
        
        <!-- Error state -->
        <div v-else-if="error" class="absolute inset-0 flex items-center justify-center">
          <div class="text-center text-white">
            <Camera class="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p class="text-sm">{{ error }}</p>
          </div>
        </div>
        
        <!-- Video stream -->
        <video
          v-show="!isLoading && !error"
          ref="videoRef"
          class="w-full h-full object-contain"
          autoplay
          playsinline
          :muted="isMuted"
          @loadeddata="handleVideoLoad"
          @error="handleVideoError"
        />
        
        <!-- Exit fullscreen button -->
        <Button
          v-if="isPageFullscreen"
          variant="ghost"
          size="icon"
          class="absolute top-4 right-4 text-white hover:bg-white/20 z-50 w-12 h-12"
          @click="exitFullscreen"
          :title="t('camera.actions.exitFullscreen')"
        >
          <X class="w-8 h-8" />
        </Button>
        
        <!-- Control overlay -->
        <div 
          v-if="showCameraControls && !isLoading && !error"
          class="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/60 to-transparent"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <!-- Mute/Unmute -->
              <Button
                variant="ghost"
                size="icon"
                class="text-white hover:bg-white/20"
                @click="toggleMute"
                :title="isMuted ? t('camera.actions.unmute') : t('camera.actions.mute')"
              >
                <component 
                  :is="isMuted ? VolumeX : Volume2" 
                  class="w-4 h-4"
                />
              </Button>
              
              <!-- Record -->
              <Button
                v-if="allowControl && entity.state !== 'recording'"
                variant="ghost"
                size="icon"
                class="text-white hover:bg-white/20"
                @click="startRecording"
                :title="t('camera.actions.record')"
              >
                <div class="w-4 h-4 rounded-full bg-red-500" />
              </Button>
              
              <!-- Motion detection -->
              <Button
                v-if="allowControl && entity.attributes.motion_detection !== undefined"
                variant="ghost"
                size="icon"
                class="text-white hover:bg-white/20"
                @click="toggleMotionDetection"
                :title="isMotionDetectionEnabled ? t('camera.actions.disableMotion') : t('camera.actions.enableMotion')"
              >
                <component 
                  :is="isMotionDetectionEnabled ? Activity : ActivitySquare" 
                  class="w-4 h-4"
                />
              </Button>
            </div>
            
            <div class="flex items-center gap-2">
              <!-- Fullscreen -->
              <Button
                v-if="!isPageFullscreen"
                variant="ghost"
                size="icon"
                class="text-white hover:bg-white/20"
                @click="toggleFullscreen"
                :title="t('camera.actions.fullscreen')"
              >
                <Maximize class="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
    
    <!-- Camera info -->
    <div v-if="entity.attributes.brand || entity.attributes.model" class="flex items-center justify-between text-sm text-muted-foreground">
      <span v-if="entity.attributes.brand">{{ entity.attributes.brand }}</span>
      <span v-if="entity.attributes.model">{{ entity.attributes.model }}</span>
    </div>
  </div>
</template>

<style scoped>
.fullscreen-wrapper {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  z-index: 9999 !important;
  background-color: black;
}
</style>