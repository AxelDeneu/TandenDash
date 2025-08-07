import { z } from 'zod'
import type { BaseWidgetConfig } from '@/types/widget'
import type { EnhancedWidgetConfig } from '@/types/widget-options'

export interface WidgetConfig extends BaseWidgetConfig {
  // Connection settings
  instanceUrl: string
  accessToken: string
  useWebSocket: boolean
  reconnectInterval: number // seconds
  
  // Display settings
  showEntityName: boolean
  showEntityState: boolean
  showLastUpdated: boolean
  showHistory: boolean
  historyHours: number
  refreshInterval: number // seconds (for non-websocket mode)
  
  // Control settings
  allowControl: boolean
  confirmActions: boolean
  
  // Camera settings
  showCameraControls: boolean
  
  // Appearance
  backgroundColor: string
  textColor: string
  primaryColor: string
  secondaryColor: string
  fontSize: number
  borderRadius: number
}

export const widgetDefaults: WidgetConfig = {
  // Connection settings
  instanceUrl: '',
  accessToken: '',
  useWebSocket: true,
  reconnectInterval: 30,
  
  // Display settings
  showEntityName: true,
  showEntityState: true,
  showLastUpdated: false,
  showHistory: false,
  historyHours: 24,
  refreshInterval: 60,
  
  // Control settings
  allowControl: true,
  confirmActions: false,
  
  // Camera settings
  showCameraControls: true,
  
  // Appearance
  backgroundColor: 'bg-background',
  textColor: 'text-foreground',
  primaryColor: 'text-primary',
  secondaryColor: 'text-muted-foreground',
  fontSize: 14,
  borderRadius: 8,
  
  // Base widget config
  minWidth: 200,
  minHeight: 150,
}

export const WidgetConfigSchema = z.object({
  // Connection settings
  instanceUrl: z.string().url().or(z.literal('')),
  accessToken: z.string(),
  useWebSocket: z.boolean(),
  reconnectInterval: z.number().min(5).max(300),
  
  // Display settings
  showEntityName: z.boolean(),
  showEntityState: z.boolean(),
  showLastUpdated: z.boolean(),
  showHistory: z.boolean(),
  historyHours: z.number().min(1).max(168), // 1 hour to 7 days
  refreshInterval: z.number().min(10).max(3600),
  
  // Control settings
  allowControl: z.boolean(),
  confirmActions: z.boolean(),
  
  // Camera settings
  showCameraControls: z.boolean(),
  
  // Appearance
  backgroundColor: z.string(),
  textColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  fontSize: z.number().min(10).max(24),
  borderRadius: z.number().min(0).max(24),
  
  // Base widget config
  minWidth: z.number().min(150),
  minHeight: z.number().min(100)
})

export const widgetConfig: EnhancedWidgetConfig = {
  groups: [
    {
      id: 'connection',
      label: '@config.groups.connection.label',
      description: '@config.groups.connection.description',
      defaultOpen: true,
      options: {
        instanceUrl: {
          type: 'text',
          label: '@options.instanceUrl',
          description: '@options.instanceUrlDesc',
          placeholder: 'http://homeassistant.local:8123'
        },
        accessToken: {
          type: 'text',
          label: '@options.accessToken',
          description: '@options.accessTokenDesc',
          placeholder: '@placeholders.accessToken'
        },
        useWebSocket: {
          type: 'toggle',
          label: '@options.useWebSocket',
          description: '@options.useWebSocketDesc'
        },
        reconnectInterval: {
          type: 'slider',
          label: '@options.reconnectInterval',
          description: '@options.reconnectIntervalDesc',
          min: 5,
          max: 300,
          step: 5,
          unit: 's',
          dependencies: { useWebSocket: true }
        }
      }
    },
    {
      id: 'display',
      label: '@config.groups.display.label',
      description: '@config.groups.display.description',
      collapsible: true,
      options: {
        showEntityName: {
          type: 'toggle',
          label: '@options.showEntityName',
          description: '@options.showEntityNameDesc'
        },
        showEntityState: {
          type: 'toggle',
          label: '@options.showEntityState',
          description: '@options.showEntityStateDesc'
        },
        showLastUpdated: {
          type: 'toggle',
          label: '@options.showLastUpdated',
          description: '@options.showLastUpdatedDesc'
        },
        showHistory: {
          type: 'toggle',
          label: '@options.showHistory',
          description: '@options.showHistoryDesc'
        },
        historyHours: {
          type: 'slider',
          label: '@options.historyHours',
          description: '@options.historyHoursDesc',
          min: 1,
          max: 168,
          step: 1,
          unit: 'h',
          dependencies: { showHistory: true }
        },
        refreshInterval: {
          type: 'slider',
          label: '@options.refreshInterval',
          description: '@options.refreshIntervalDesc',
          min: 10,
          max: 3600,
          step: 10,
          unit: 's',
          dependencies: { useWebSocket: false }
        }
      }
    },
    {
      id: 'control',
      label: '@config.groups.control.label',
      description: '@config.groups.control.description',
      collapsible: true,
      options: {
        allowControl: {
          type: 'toggle',
          label: '@options.allowControl',
          description: '@options.allowControlDesc'
        },
        confirmActions: {
          type: 'toggle',
          label: '@options.confirmActions',
          description: '@options.confirmActionsDesc',
          dependencies: { allowControl: true }
        }
      }
    },
    {
      id: 'camera',
      label: '@config.groups.camera.label',
      description: '@config.groups.camera.description',
      collapsible: true,
      options: {
        showCameraControls: {
          type: 'toggle',
          label: '@options.showCameraControls',
          description: '@options.showCameraControlsDesc'
        }
      }
    },
    {
      id: 'appearance',
      label: '@config.groups.appearance.label',
      description: '@config.groups.appearance.description',
      collapsible: true,
      options: {
        backgroundColor: {
          type: 'select',
          label: '@options.backgroundColor',
          description: '@options.backgroundColorDesc',
          options: [
            { value: 'bg-background', label: '@colors.default' },
            { value: 'bg-card', label: '@colors.card' },
            { value: 'bg-muted', label: '@colors.muted' },
            { value: 'bg-transparent', label: '@colors.transparent' }
          ]
        },
        textColor: {
          type: 'select',
          label: '@options.textColor',
          description: '@options.textColorDesc',
          options: [
            { value: 'text-foreground', label: '@colors.default' },
            { value: 'text-primary', label: '@colors.primary' },
            { value: 'text-muted-foreground', label: '@colors.muted' }
          ]
        },
        primaryColor: {
          type: 'select',
          label: '@options.primaryColor',
          description: '@options.primaryColorDesc',
          options: [
            { value: 'text-primary', label: '@colors.primary' },
            { value: 'text-blue-500', label: '@colors.blue' },
            { value: 'text-green-500', label: '@colors.green' },
            { value: 'text-yellow-500', label: '@colors.yellow' },
            { value: 'text-red-500', label: '@colors.red' }
          ]
        },
        fontSize: {
          type: 'slider',
          label: '@options.fontSize',
          description: '@options.fontSizeDesc',
          min: 10,
          max: 24,
          step: 1,
          unit: 'px'
        },
        borderRadius: {
          type: 'slider',
          label: '@options.borderRadius',
          description: '@options.borderRadiusDesc',
          min: 0,
          max: 24,
          step: 2,
          unit: 'px'
        }
      }
    }
  ]
}