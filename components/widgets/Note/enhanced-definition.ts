import type { EnhancedWidgetConfig } from '@/types/widget-options'

export const enhancedNoteConfig: EnhancedWidgetConfig = {
  name: 'Note',
  description: 'A simple text note widget with customizable styling',
  groups: [
    {
      id: 'content',
      label: 'Content',
      options: [
        {
          id: 'content',
          type: 'custom',
          label: 'Note Content',
          defaultValue: 'Click edit to add your note...',
          component: 'textarea',
          props: {
            rows: 6,
            placeholder: 'Enter your note here...'
          }
        },
        {
          id: 'enableMarkdown',
          type: 'toggle',
          label: 'Enable Markdown',
          defaultValue: false,
          description: 'Support basic markdown formatting'
        }
      ]
    },
    {
      id: 'typography',
      label: 'Typography',
      options: [
        {
          id: 'fontSize',
          type: 'slider',
          label: 'Font Size',
          defaultValue: 16,
          min: 10,
          max: 32,
          unit: 'px'
        },
        {
          id: 'fontFamily',
          type: 'select',
          label: 'Font Family',
          defaultValue: 'font-sans',
          options: [
            { value: 'font-sans', label: 'Sans Serif' },
            { value: 'font-serif', label: 'Serif' },
            { value: 'font-mono', label: 'Monospace' }
          ]
        },
        {
          id: 'textAlign',
          type: 'radio',
          label: 'Text Alignment',
          defaultValue: 'left',
          options: [
            { value: 'left', label: 'Left' },
            { value: 'center', label: 'Center' },
            { value: 'right', label: 'Right' },
            { value: 'justify', label: 'Justify' }
          ]
        },
        {
          id: 'lineHeight',
          type: 'slider',
          label: 'Line Height',
          defaultValue: 1.5,
          min: 1,
          max: 3,
          step: 0.1
        }
      ]
    },
    {
      id: 'styling',
      label: 'Styling',
      options: [
        {
          id: 'textColor',
          type: 'select',
          label: 'Text Color',
          defaultValue: 'text-foreground',
          options: [
            { value: 'text-foreground', label: 'Default' },
            { value: 'text-gray-900 dark:text-gray-100', label: 'High Contrast' },
            { value: 'text-gray-700 dark:text-gray-300', label: 'Medium Contrast' },
            { value: 'text-blue-700 dark:text-blue-300', label: 'Blue' }
          ]
        },
        {
          id: 'backgroundColor',
          type: 'select',
          label: 'Background Color',
          defaultValue: 'bg-yellow-50 dark:bg-yellow-900/20',
          options: [
            { value: 'bg-yellow-50 dark:bg-yellow-900/20', label: 'Yellow (Sticky Note)' },
            { value: 'bg-background', label: 'Default' },
            { value: 'bg-white dark:bg-gray-900', label: 'White/Dark' },
            { value: 'bg-blue-50 dark:bg-blue-900/20', label: 'Light Blue' },
            { value: 'bg-green-50 dark:bg-green-900/20', label: 'Light Green' },
            { value: 'bg-pink-50 dark:bg-pink-900/20', label: 'Light Pink' }
          ]
        },
        {
          id: 'padding',
          type: 'slider',
          label: 'Padding',
          defaultValue: 16,
          min: 0,
          max: 48,
          unit: 'px'
        },
        {
          id: 'borderRadius',
          type: 'slider',
          label: 'Border Radius',
          defaultValue: 8,
          min: 0,
          max: 24,
          unit: 'px'
        }
      ]
    },
    {
      id: 'borders',
      label: 'Borders & Effects',
      options: [
        {
          id: 'showBorder',
          type: 'toggle',
          label: 'Show Border',
          defaultValue: true
        },
        {
          id: 'borderColor',
          type: 'select',
          label: 'Border Color',
          defaultValue: 'border-yellow-200 dark:border-yellow-800',
          options: [
            { value: 'border-yellow-200 dark:border-yellow-800', label: 'Yellow' },
            { value: 'border-border', label: 'Default' },
            { value: 'border-gray-200 dark:border-gray-700', label: 'Gray' },
            { value: 'border-blue-200 dark:border-blue-700', label: 'Blue' }
          ],
          showIf: { showBorder: true }
        },
        {
          id: 'borderWidth',
          type: 'slider',
          label: 'Border Width',
          defaultValue: 2,
          min: 0,
          max: 8,
          unit: 'px',
          showIf: { showBorder: true }
        },
        {
          id: 'shadowStyle',
          type: 'select',
          label: 'Shadow',
          defaultValue: 'sm',
          options: [
            { value: 'none', label: 'None' },
            { value: 'sm', label: 'Small' },
            { value: 'md', label: 'Medium' },
            { value: 'lg', label: 'Large' },
            { value: 'xl', label: 'Extra Large' }
          ]
        }
      ]
    }
  ]
}