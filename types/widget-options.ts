import type { ZodSchema } from 'zod'

export interface WidgetOptionDefinition {
  type: 'select' | 'color' | 'slider' | 'toggle' | 'text' | 'tags' | 'checkbox' | 'radio' | 'custom'
  label: string
  description?: string
  options?: OptionItem[]
  min?: number
  max?: number
  step?: number
  placeholder?: string
  validation?: ZodSchema
  group?: string
  dependencies?: Record<string, any> // Show field only when other fields have specific values
  unit?: string // For sliders (px, %, etc.)
  preview?: boolean // Show real-time preview
  dataFetcher?: () => Promise<OptionItem[]> // Function to fetch dynamic options
  customComponent?: string // For custom type - name of the custom component to use
  actions?: WidgetOptionAction[] // Actions like create/delete for list management
  refreshOn?: string[] // List of field keys that should trigger a refresh of this field's data
  allowCustomValue?: boolean // Allow custom values in select fields
}

export interface WidgetOptionAction {
  id: string
  label: string
  icon?: string // Lucide icon name
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  handler?: (context: any) => Promise<void> | void
  confirmMessage?: string // Show confirmation dialog before executing
}

export interface OptionItem {
  value: string | number | boolean
  label: string
  description?: string
  icon?: string // Lucide icon name
}

export interface WidgetOptionGroup {
  id: string
  label: string
  description?: string
  collapsible?: boolean
  defaultOpen?: boolean
  options: Record<string, WidgetOptionDefinition>
}

export interface EnhancedWidgetConfig {
  groups: WidgetOptionGroup[]
  ungrouped?: Record<string, WidgetOptionDefinition>
}

// Predefined common options
export const TEXT_SIZE_OPTIONS: OptionItem[] = [
  { value: 'text-xs', label: 'Extra Small', description: '12px' },
  { value: 'text-sm', label: 'Small', description: '14px' },
  { value: 'text-base', label: 'Medium', description: '16px' },
  { value: 'text-lg', label: 'Large', description: '18px' },
  { value: 'text-xl', label: 'Extra Large', description: '20px' },
  { value: 'text-2xl', label: '2X Large', description: '24px' },
  { value: 'text-3xl', label: '3X Large', description: '30px' },
  { value: 'text-4xl', label: '4X Large', description: '36px' },
  { value: 'text-5xl', label: '5X Large', description: '48px' },
  { value: 'text-6xl', label: '6X Large', description: '60px' }
]

// New numeric font size options for sliders
export const FONT_SIZE_PRESETS: OptionItem[] = [
  { value: 12, label: 'Extra Small', description: '12px' },
  { value: 14, label: 'Small', description: '14px' },
  { value: 16, label: 'Medium', description: '16px' },
  { value: 18, label: 'Large', description: '18px' },
  { value: 20, label: 'Extra Large', description: '20px' },
  { value: 24, label: '2X Large', description: '24px' },
  { value: 30, label: '3X Large', description: '30px' },
  { value: 36, label: '4X Large', description: '36px' },
  { value: 48, label: '5X Large', description: '48px' },
  { value: 60, label: '6X Large', description: '60px' },
  { value: 72, label: '7X Large', description: '72px' }
]

export const SPACING_OPTIONS: OptionItem[] = [
  { value: 'mt-0', label: 'None', description: '0px' },
  { value: 'mt-1', label: 'Extra Small', description: '4px' },
  { value: 'mt-2', label: 'Small', description: '8px' },
  { value: 'mt-4', label: 'Medium', description: '16px' },
  { value: 'mt-6', label: 'Large', description: '24px' },
  { value: 'mt-8', label: 'Extra Large', description: '32px' }
]

export const COLOR_OPTIONS: OptionItem[] = [
  { value: 'text-black', label: 'Black' },
  { value: 'text-white', label: 'White' },
  { value: 'text-gray-500', label: 'Gray' },
  { value: 'text-blue-500', label: 'Blue' },
  { value: 'text-red-500', label: 'Red' },
  { value: 'text-green-500', label: 'Green' },
  { value: 'text-yellow-500', label: 'Yellow' },
  { value: 'text-purple-500', label: 'Purple' },
  { value: 'text-pink-500', label: 'Pink' },
  { value: 'text-indigo-500', label: 'Indigo' }
]

export const BACKGROUND_COLOR_OPTIONS: OptionItem[] = [
  { value: 'bg-transparent', label: 'Transparent' },
  { value: 'bg-white', label: 'White' },
  { value: 'bg-black', label: 'Black' },
  { value: 'bg-gray-100', label: 'Light Gray' },
  { value: 'bg-gray-800', label: 'Dark Gray' },
  { value: 'bg-blue-100', label: 'Light Blue' },
  { value: 'bg-blue-800', label: 'Dark Blue' },
  { value: 'bg-red-100', label: 'Light Red' },
  { value: 'bg-green-100', label: 'Light Green' },
  { value: 'bg-yellow-100', label: 'Light Yellow' }
]