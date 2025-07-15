// This file is deprecated - types moved to specific modules
// @deprecated Use types from './widget', './page', './todo' instead

import type { WidgetPositionDB, ParsedWidgetInstance, Page } from './index'

/** @deprecated Use WidgetPositionDB from './widget' */
export interface Position extends WidgetPositionDB {}

/** @deprecated Use ParsedWidgetInstance from './widget' */
export interface WidgetConfig extends Omit<ParsedWidgetInstance, 'createdAt' | 'updatedAt'> {
  id: string
}

/** @deprecated Use PageWithWidgets from './page' */
export interface PageConfig extends Omit<Page, 'id'> {
  id: string
  widgets: WidgetConfig[]
} 