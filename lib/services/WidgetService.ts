import type { IWidgetService, ServiceResult, ServiceListResult, ILoggerService } from './interfaces'
import type { IWidgetRepository } from '@/lib/repositories/interfaces'
import type { 
  WidgetInstance, 
  ParsedWidgetInstance,
  CreateWidgetRequest, 
  UpdateWidgetRequest,
  WidgetPosition
} from '@/types/widget'
import { safeParseJson, WidgetPositionDBSchema } from '@/lib/validation'
import { BaseService } from './BaseService'

export class WidgetService extends BaseService implements IWidgetService {
  protected readonly entityName = 'Widget'
  
  constructor(
    private readonly widgetRepository: IWidgetRepository,
    logger?: ILoggerService
  ) {
    super(logger)
  }

  async getAllWidgets(pageId?: number): Promise<ServiceListResult<WidgetInstance>> {
    try {
      this.logOperation('getAllWidgets', { pageId })
      
      const widgets = pageId 
        ? await this.widgetRepository.findByPageId(pageId)
        : await this.widgetRepository.findAll()
      
      return this.successList(widgets)
    } catch (error) {
      return this.handleListError(error, 'fetch widgets')
    }
  }

  async getWidgetById(id: number): Promise<ServiceResult<WidgetInstance>> {
    try {
      this.logOperation('getWidgetById', { id })
      
      const widget = await this.widgetRepository.findById(id)
      
      if (!widget) {
        return this.notFound(id)
      }

      return this.success(widget)
    } catch (error) {
      return this.handleError(error, 'fetch widget')
    }
  }

  async createWidget(data: CreateWidgetRequest): Promise<ServiceResult<WidgetInstance>> {
    try {
      this.logOperation('createWidget', data)
      
      const widget = await this.widgetRepository.create(data)
      
      return this.success(widget)
    } catch (error) {
      return this.handleError(error, 'create widget')
    }
  }

  async updateWidget(id: number, data: UpdateWidgetRequest): Promise<ServiceResult<WidgetInstance>> {
    try {
      this.logOperation('updateWidget', { id, ...data })
      
      const widget = await this.widgetRepository.update(id, data)
      
      return this.success(widget)
    } catch (error) {
      return this.handleError(error, 'update widget')
    }
  }

  async deleteWidget(id: number): Promise<ServiceResult<boolean>> {
    try {
      this.logOperation('deleteWidget', { id })
      
      const deleted = await this.widgetRepository.delete(id)
      
      if (!deleted) {
        return this.notFound(id)
      }

      return this.success(true)
    } catch (error) {
      return this.handleError(error, 'delete widget')
    }
  }

  async getWidgetsByType(type: string): Promise<ServiceListResult<WidgetInstance>> {
    try {
      this.logOperation('getWidgetsByType', { type })
      
      const widgets = await this.widgetRepository.findByType(type)
      
      return this.successList(widgets)
    } catch (error) {
      return this.handleListError(error, 'fetch widgets by type')
    }
  }

  async bulkUpdateWidgets(widgets: Array<{ id: number; position?: string; options?: string }>): Promise<ServiceListResult<WidgetInstance>> {
    try {
      this.logOperation('bulkUpdateWidgets', { count: widgets.length })
      
      const updatedWidgets = await this.widgetRepository.bulkUpdate(widgets)
      
      return this.successList(updatedWidgets)
    } catch (error) {
      return this.handleListError(error, 'bulk update widgets')
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
      this.logger?.error('Failed to parse widget instance', error, {
        module: 'widget',
        method: 'parseWidgetInstance',
        widgetId: widget.id
      })
      return {
        ...widget,
        position: { x: 0, y: 0, width: 200, height: 150 },
        options: {}
      }
    }
  }
}