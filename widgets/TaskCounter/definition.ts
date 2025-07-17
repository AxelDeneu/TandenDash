import type { BaseWidgetConfig } from '@/types/widget'
import { z } from 'zod'

export interface WidgetConfig extends BaseWidgetConfig {
  title: string
  color: string
  showBorder: boolean
  taskCount: number
  completedTasks: number
  showProgress: boolean
}

export const widgetDefaults: WidgetConfig = {
  title: 'Task Counter',
  color: '#3b82f6',
  showBorder: true,
  taskCount: 10,
  completedTasks: 3,
  showProgress: true,
  minWidth: 300,
  minHeight: 200
}

export const WidgetConfigSchema = z.object({
  title: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  showBorder: z.boolean(),
  taskCount: z.number().min(0).max(1000),
  completedTasks: z.number().min(0).max(1000),
  showProgress: z.boolean(),
  minWidth: z.number().min(1),
  minHeight: z.number().min(1)
})

// Widget configuration groups for UI
export const widgetConfig = {
  groups: [
    {
      id: 'display',
      label: 'Display Settings',
      description: 'Configure what information to show',
      defaultOpen: true,
      options: {
        title: {
          type: 'text',
          label: 'Widget Title',
          description: 'The title displayed at the top of the widget',
          placeholder: 'Task Counter'
        },
        showBorder: {
          type: 'toggle',
          label: 'Show Border',
          description: 'Display a colored border around the widget'
        },
        showProgress: {
          type: 'toggle',
          label: 'Show Progress Bar',
          description: 'Display a progress bar showing completion percentage'
        }
      }
    },
    {
      id: 'tasks',
      label: 'Task Configuration',
      description: 'Configure task counts and progress',
      collapsible: true,
      options: {
        taskCount: {
          type: 'slider',
          label: 'Total Tasks',
          description: 'The total number of tasks',
          min: 0,
          max: 100,
          step: 1,
          unit: 'tasks'
        },
        completedTasks: {
          type: 'slider',
          label: 'Completed Tasks',
          description: 'The number of completed tasks',
          min: 0,
          max: 100,
          step: 1,
          unit: 'tasks'
        }
      }
    },
    {
      id: 'appearance',
      label: 'Appearance',
      description: 'Customize colors and styling',
      collapsible: true,
      options: {
        color: {
          type: 'color',
          label: 'Accent Color',
          description: 'The primary color for the widget theme'
        }
      }
    }
  ]
}