import type { BaseWidgetConfig } from '@/types/widget'

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

export const noteWidgetOptions: Required<Omit<NoteWidgetConfig, keyof BaseWidgetConfig>> = {
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
};