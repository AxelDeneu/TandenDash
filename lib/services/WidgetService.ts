import type { IWidgetService, ServiceResult, ServiceListResult } from './interfaces'
import type { IWidgetRepository } from '@/lib/repositories/interfaces'
import type { 
  WidgetInstance, 
  ParsedWidgetInstance,
  CreateWidgetRequest, 
  UpdateWidgetRequest,
  WidgetPosition
} from '@/types/widget'
import { validateWidgetConfig, safeParseJson, WidgetPositionDBSchema } from '@/lib/validation'

export class WidgetService implements IWidgetService {
  constructor(private readonly widgetRepository: IWidgetRepository) {}

  async getAllWidgets(pageId?: number): Promise<ServiceListResult<WidgetInstance>> {
    try {
      const widgets = pageId 
        ? await this.widgetRepository.findByPageId(pageId)
        : await this.widgetRepository.findAll()
      
      return {
        success: true,
        data: widgets,
        total: widgets.length
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch widgets'
      }
    }
  }

  async getWidgetById(id: number): Promise<ServiceResult<WidgetInstance>> {
    try {
      const widget = await this.widgetRepository.findById(id)
      
      if (!widget) {
        return {
          success: false,
          error: `Widget with id ${id} not found`
        }
      }

      return {
        success: true,
        data: widget
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch widget'
      }
    }
  }

  async createWidget(data: CreateWidgetRequest): Promise<ServiceResult<WidgetInstance>> {
    try {
      // Additional business logic validation can go here
      const widget = await this.widgetRepository.create(data)
      
      return {
        success: true,
        data: widget
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create widget'
      }
    }
  }

  async updateWidget(id: number, data: UpdateWidgetRequest): Promise<ServiceResult<WidgetInstance>> {
    try {
      const widget = await this.widgetRepository.update(id, data)
      
      return {
        success: true,
        data: widget
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update widget'
      }
    }
  }

  async deleteWidget(id: number): Promise<ServiceResult<boolean>> {
    try {
      const deleted = await this.widgetRepository.delete(id)
      
      if (!deleted) {
        return {
          success: false,
          error: `Widget with id ${id} not found`
        }
      }

      return {
        success: true,
        data: true
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete widget'
      }
    }
  }

  async getWidgetsByType(type: string): Promise<ServiceListResult<WidgetInstance>> {
    try {
      const widgets = await this.widgetRepository.findByType(type)
      
      return {
        success: true,
        data: widgets,
        total: widgets.length
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch widgets by type'
      }
    }
  }

  async bulkUpdateWidgets(widgets: Array<{ id: number; position?: string; options?: string }>): Promise<ServiceListResult<WidgetInstance>> {
    try {
      const updatedWidgets = await this.widgetRepository.bulkUpdate(widgets)
      
      return {
        success: true,
        data: updatedWidgets,
        total: updatedWidgets.length
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to bulk update widgets'
      }
    }
  }

  async validateWidgetConfig(type: string, config: unknown): Promise<ServiceResult<boolean>> {
    try {
      validateWidgetConfig(type, config)
      
      return {
        success: true,
        data: true
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Widget configuration validation failed'
      }
    }
  }

  parseWidgetInstance(widget: WidgetInstance): ParsedWidgetInstance {
    try {
      // Parse position from JSON string to object
      const positionDB = safeParseJson(widget.position, WidgetPositionDBSchema)
      const position: WidgetPosition = {
        x: parseInt(positionDB.left, 10),
        y: parseInt(positionDB.top, 10),
        width: parseInt(positionDB.width, 10),
        height: parseInt(positionDB.height, 10)
      }

      // Parse options from JSON string
      const options = JSON.parse(widget.options)

      return {
        ...widget,
        position,
        options
      }
    } catch (error) {
      // Return widget with default values if parsing fails
      console.error('Failed to parse widget instance:', error)
      return {
        ...widget,
        position: { x: 0, y: 0, width: 200, height: 150 },
        options: {}
      }
    }
  }
}