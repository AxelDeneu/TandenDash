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
      label: '@config.groups.content.label',
      description: '@config.groups.content.description',
      defaultOpen: true,
      options: {
        content: {
          type: 'custom',
          label: '@config.options.content.label',
          component: 'textarea',
          props: {
            rows: 6,
            placeholder: '@config.options.content.placeholder'
          }
        },
        enableMarkdown: {
          type: 'toggle',
          label: '@config.options.enableMarkdown.label',
          description: '@config.options.enableMarkdown.description'
        }
      }
    },
    {
      id: 'typography',
      label: '@config.groups.typography.label',
      description: '@config.groups.typography.description',
      collapsible: true,
      options: {
        fontSize: {
          type: 'slider',
          label: '@config.options.fontSize.label',
          description: '@config.options.fontSize.description',
          min: 10,
          max: 32,
          unit: 'px'
        },
        fontFamily: {
          type: 'select',
          label: '@config.options.fontFamily.label',
          description: '@config.options.fontFamily.description',
          options: [
            { value: 'font-sans', label: '@config.options.fontFamily.options.sans.label' },
            { value: 'font-serif', label: '@config.options.fontFamily.options.serif.label' },
            { value: 'font-mono', label: '@config.options.fontFamily.options.mono.label' }
          ]
        },
        textAlign: {
          type: 'radio',
          label: '@config.options.textAlign.label',
          description: '@config.options.textAlign.description',
          options: [
            { value: 'left', label: '@config.options.textAlign.options.left.label' },
            { value: 'center', label: '@config.options.textAlign.options.center.label' },
            { value: 'right', label: '@config.options.textAlign.options.right.label' },
            { value: 'justify', label: '@config.options.textAlign.options.justify.label' }
          ]
        },
        lineHeight: {
          type: 'slider',
          label: '@config.options.lineHeight.label',
          description: '@config.options.lineHeight.description',
          min: 1,
          max: 3,
          step: 0.1
        }
      }
    },
    {
      id: 'styling',
      label: '@config.groups.styling.label',
      description: '@config.groups.styling.description',
      collapsible: true,
      options: {
        textColor: {
          type: 'select',
          label: '@config.options.textColor.label',
          description: '@config.options.textColor.description',
          options: [
            { value: 'text-foreground', label: '@config.options.textColor.options.default.label' },
            { value: 'text-gray-900 dark:text-gray-100', label: '@config.options.textColor.options.highContrast.label' },
            { value: 'text-gray-700 dark:text-gray-300', label: '@config.options.textColor.options.mediumContrast.label' },
            { value: 'text-blue-700 dark:text-blue-300', label: '@config.options.textColor.options.blue.label' }
          ]
        },
        backgroundColor: {
          type: 'select',
          label: '@config.options.backgroundColor.label',
          description: '@config.options.backgroundColor.description',
          options: [
            { value: 'bg-yellow-50 dark:bg-yellow-900/20', label: '@config.options.backgroundColor.options.yellow.label' },
            { value: 'bg-background', label: '@config.options.backgroundColor.options.default.label' },
            { value: 'bg-white dark:bg-gray-900', label: '@config.options.backgroundColor.options.white.label' },
            { value: 'bg-blue-50 dark:bg-blue-900/20', label: '@config.options.backgroundColor.options.lightBlue.label' },
            { value: 'bg-green-50 dark:bg-green-900/20', label: '@config.options.backgroundColor.options.lightGreen.label' },
            { value: 'bg-pink-50 dark:bg-pink-900/20', label: '@config.options.backgroundColor.options.lightPink.label' }
          ]
        },
        padding: {
          type: 'slider',
          label: '@config.options.padding.label',
          description: '@config.options.padding.description',
          min: 0,
          max: 48,
          unit: 'px'
        },
        borderRadius: {
          type: 'slider',
          label: '@config.options.borderRadius.label',
          description: '@config.options.borderRadius.description',
          min: 0,
          max: 24,
          unit: 'px'
        }
      }
    },
    {
      id: 'borders',
      label: '@config.groups.borders.label',
      description: '@config.groups.borders.description',
      collapsible: true,
      options: {
        showBorder: {
          type: 'toggle',
          label: '@config.options.showBorder.label',
          description: '@config.options.showBorder.description'
        },
        borderColor: {
          type: 'select',
          label: '@config.options.borderColor.label',
          description: '@config.options.borderColor.description',
          options: [
            { value: 'border-yellow-200 dark:border-yellow-800', label: '@config.options.borderColor.options.yellow.label' },
            { value: 'border-border', label: '@config.options.borderColor.options.default.label' },
            { value: 'border-gray-200 dark:border-gray-700', label: '@config.options.borderColor.options.gray.label' },
            { value: 'border-blue-200 dark:border-blue-700', label: '@config.options.borderColor.options.blue.label' }
          ],
          dependencies: { showBorder: true }
        },
        borderWidth: {
          type: 'slider',
          label: '@config.options.borderWidth.label',
          description: '@config.options.borderWidth.description',
          min: 0,
          max: 8,
          unit: 'px',
          dependencies: { showBorder: true }
        },
        shadowStyle: {
          type: 'select',
          label: '@config.options.shadowStyle.label',
          description: '@config.options.shadowStyle.description',
          options: [
            { value: 'none', label: '@config.options.shadowStyle.options.none.label' },
            { value: 'sm', label: '@config.options.shadowStyle.options.sm.label' },
            { value: 'md', label: '@config.options.shadowStyle.options.md.label' },
            { value: 'lg', label: '@config.options.shadowStyle.options.lg.label' },
            { value: 'xl', label: '@config.options.shadowStyle.options.xl.label' }
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