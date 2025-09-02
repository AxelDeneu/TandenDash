export interface SelectedEntity {
  entityId: string
  displayName: string
  customIcon: string
  displayMode: 'default' | 'compact'
  order?: number
}

export interface EntityDisplayConfig {
  selectedEntities: SelectedEntity[]
}

export type EntityDisplayMode = 'default' | 'compact'

export interface EntityToggleResult {
  success: boolean
  newState?: string
  error?: string
}

// Default icons mapping by Home Assistant domain
export const DEFAULT_DOMAIN_ICONS: Record<string, string> = {
  light: 'Lightbulb',
  switch: 'Power',
  sensor: 'Thermometer', 
  binary_sensor: 'Radio',
  climate: 'Thermometer',
  cover: 'MoreVertical',
  fan: 'Fan',
  lock: 'Lock',
  media_player: 'Play',
  camera: 'Camera',
  vacuum: 'RotateCcw',
  alarm_control_panel: 'ShieldAlert',
  device_tracker: 'MapPin',
  zone: 'MapPin',
  automation: 'Zap',
  script: 'FileCode',
  scene: 'Image',
  input_boolean: 'ToggleLeft',
  input_select: 'List',
  input_number: 'Hash',
  input_text: 'Type',
  timer: 'Timer',
  counter: 'Hash',
  weather: 'Cloud'
}

// Popular Lucide icons for user selection
export const AVAILABLE_ICONS = [
  'Home', 'Lightbulb', 'Power', 'Thermometer', 'Radio', 'Wifi',
  'Camera', 'Lock', 'Unlock', 'Timer', 'Clock', 'Calendar',
  'Play', 'Pause', 'Volume2', 'VolumeX', 'Fan', 'Wind',
  'Sun', 'Moon', 'CloudRain', 'Cloud', 'Umbrella', 'Snowflake',
  'Car', 'Bike', 'MapPin', 'Navigation', 'Compass', 'Map',
  'Heart', 'Activity', 'Zap', 'Battery', 'Cpu', 'HardDrive',
  'Shield', 'ShieldAlert', 'Eye', 'EyeOff', 'Bell', 'BellOff',
  'Settings', 'MoreVertical', 'Plus', 'Minus', 'X', 'Check'
] as const

export type AvailableIcon = typeof AVAILABLE_ICONS[number]

// Helper function to get default icon for a domain
export function getDefaultIconForDomain(domain: string): string {
  return DEFAULT_DOMAIN_ICONS[domain] || 'HelpCircle'
}

// Helper function to validate icon name
export function isValidIcon(iconName: string): boolean {
  return AVAILABLE_ICONS.includes(iconName as AvailableIcon) || 
         iconName in DEFAULT_DOMAIN_ICONS
}