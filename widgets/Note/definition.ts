import type { BaseWidgetConfig } from '@/types/widget'
import { z } from 'zod'

// Widget configuration interface
export interface NoteWidgetConfig extends BaseWidgetConfig {
  content: string
  fontSize: number
  fontFamily: string
  textColor: string
  backgroundColor: string
  padding: number
  borderRadius: number
  showBorder: boolean
  borderColor: string
  borderWidth: number
  textAlign: 'left' | 'center' | 'right' | 'justify'
  enableMarkdown: boolean
  shadowStyle: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  lineHeight: number
}

// Default configuration values
export const widgetDefaults: Required<NoteWidgetConfig> = {
  content: '',
  fontSize: 16,
  fontFamily: 'font-sans',
  textColor: 'text-foreground',
  backgroundColor: 'bg-yellow-50 dark:bg-yellow-900/20',
  padding: 16,
  borderRadius: 8,
  showBorder: true,
  borderColor: 'border-yellow-200 dark:border-yellow-800',
  borderWidth: 2,
  textAlign: 'left',
  enableMarkdown: false,
  shadowStyle: 'sm',
  lineHeight: 1.5,
  minWidth: 250,
  minHeight: 150,
}

// Widget configuration groups for UI
export const widgetConfig = {
  groups: [
    {
      id: 'content',
      label: 'Content',
      defaultOpen: true,
      options: {
        content: {
          type: 'custom',
          label: 'Note Content',
          component: 'textarea',
          props: {
            rows: 6,
            placeholder: 'Enter your note here...'
          }
        },
        enableMarkdown: {
          type: 'toggle',
          label: 'Enable Markdown',
          description: 'Support basic markdown formatting'
        }
      }
    },
    {
      id: 'typography',
      label: 'Typography',
      collapsible: true,
      options: {
        fontSize: {
          type: 'slider',
          label: 'Font Size',
          min: 10,
          max: 32,
          unit: 'px'
        },
        fontFamily: {
          type: 'select',
          label: 'Font Family',
          options: [
            { value: 'font-sans', label: 'Sans Serif' },
            { value: 'font-serif', label: 'Serif' },
            { value: 'font-mono', label: 'Monospace' }
          ]
        },
        textAlign: {
          type: 'radio',
          label: 'Text Alignment',
          options: [
            { value: 'left', label: 'Left' },
            { value: 'center', label: 'Center' },
            { value: 'right', label: 'Right' },
            { value: 'justify', label: 'Justify' }
          ]
        },
        lineHeight: {
          type: 'slider',
          label: 'Line Height',
          min: 1,
          max: 3,
          step: 0.1
        }
      }
    },
    {
      id: 'styling',
      label: 'Styling',
      collapsible: true,
      options: {
        textColor: {
          type: 'select',
          label: 'Text Color',
          options: [
            { value: 'text-foreground', label: 'Default' },
            { value: 'text-gray-900 dark:text-gray-100', label: 'High Contrast' },
            { value: 'text-gray-700 dark:text-gray-300', label: 'Medium Contrast' },
            { value: 'text-blue-700 dark:text-blue-300', label: 'Blue' }
          ]
        },
        backgroundColor: {
          type: 'select',
          label: 'Background Color',
          options: [
            { value: 'bg-yellow-50 dark:bg-yellow-900/20', label: 'Yellow (Sticky Note)' },
            { value: 'bg-background', label: 'Default' },
            { value: 'bg-white dark:bg-gray-900', label: 'White/Dark' },
            { value: 'bg-blue-50 dark:bg-blue-900/20', label: 'Light Blue' },
            { value: 'bg-green-50 dark:bg-green-900/20', label: 'Light Green' },
            { value: 'bg-pink-50 dark:bg-pink-900/20', label: 'Light Pink' }
          ]
        },
        padding: {
          type: 'slider',
          label: 'Padding',
          min: 0,
          max: 48,
          unit: 'px'
        },
        borderRadius: {
          type: 'slider',
          label: 'Border Radius',
          min: 0,
          max: 24,
          unit: 'px'
        }
      }
    },
    {
      id: 'borders',
      label: 'Borders & Effects',
      collapsible: true,
      options: {
        showBorder: {
          type: 'toggle',
          label: 'Show Border'
        },
        borderColor: {
          type: 'select',
          label: 'Border Color',
          options: [
            { value: 'border-yellow-200 dark:border-yellow-800', label: 'Yellow' },
            { value: 'border-border', label: 'Default' },
            { value: 'border-gray-200 dark:border-gray-700', label: 'Gray' },
            { value: 'border-blue-200 dark:border-blue-700', label: 'Blue' }
          ],
          dependencies: { showBorder: true }
        },
        borderWidth: {
          type: 'slider',
          label: 'Border Width',
          min: 0,
          max: 8,
          unit: 'px',
          dependencies: { showBorder: true }
        },
        shadowStyle: {
          type: 'select',
          label: 'Shadow',
          options: [
            { value: 'none', label: 'None' },
            { value: 'sm', label: 'Small' },
            { value: 'md', label: 'Medium' },
            { value: 'lg', label: 'Large' },
            { value: 'xl', label: 'Extra Large' }
          ]
        }
      }
    }
  ]
}

// Validation schema
export const WidgetConfigSchema = z.object({
  content: z.string(),
  fontSize: z.number().min(10).max(32),
  fontFamily: z.string(),
  textColor: z.string(),
  backgroundColor: z.string(),
  padding: z.number().min(0).max(48),
  borderRadius: z.number().min(0).max(24),
  showBorder: z.boolean(),
  borderColor: z.string(),
  borderWidth: z.number().min(0).max(8),
  textAlign: z.enum(['left', 'center', 'right', 'justify']),
  enableMarkdown: z.boolean(),
  shadowStyle: z.enum(['none', 'sm', 'md', 'lg', 'xl']),
  lineHeight: z.number().min(1).max(3),
  minWidth: z.number().min(1),
  minHeight: z.number().min(1)
})