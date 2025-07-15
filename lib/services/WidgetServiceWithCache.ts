import { WidgetService } from './WidgetService'
import { CacheableService, CacheResult, InvalidatesCache } from '../cache/service-cache'
import type { IWidgetService, ServiceResult, ServiceListResult } from './interfaces'
import type { IWidgetRepository } from '@/lib/repositories/interfaces'
import type { 
  WidgetInstance, 
  CreateWidgetRequest, 
  UpdateWidgetRequest,
  BatchUpdateWidgetRequest 
} from '@/types/widget'

export class WidgetServiceWithCache extends WidgetService implements IWidgetService {
  private _cache: any // Cache manager will be injected by decorators
  
  constructor(widgetRepository: IWidgetRepository) {
    super(widgetRepository)
  }
  
  @CacheResult({
    ttl: 3 * 60 * 1000, // 3 minutes
    tags: ['widgets', 'all-widgets']
  })
  async getAllWidgets(pageId?: number): Promise<ServiceListResult<WidgetInstance>> {
    return super.getAllWidgets(pageId)
  }
  
  @CacheResult({
    ttl: 5 * 60 * 1000, // 5 minutes
    tags: ['widgets', 'widget-detail']
  })
  async getWidgetById(id: number): Promise<ServiceResult<WidgetInstance>> {
    return super.getWidgetById(id)
  }
  
  @CacheResult({
    ttl: 3 * 60 * 1000, // 3 minutes
    tags: ['widgets', 'widget-by-type']
  })
  async getWidgetsByType(type: string, pageId?: number): Promise<ServiceListResult<WidgetInstance>> {
    return super.getWidgetsByType(type, pageId)
  }
  
  @InvalidatesCache(['widgets', 'all-widgets', 'widget-by-type', 'page-widgets'])
  async createWidget(data: CreateWidgetRequest): Promise<ServiceResult<WidgetInstance>> {
    return super.createWidget(data)
  }
  
  @InvalidatesCache(['widgets', 'all-widgets', 'widget-detail', 'widget-by-type', 'page-widgets'])
  async updateWidget(data: UpdateWidgetRequest): Promise<ServiceResult<WidgetInstance>> {
    return super.updateWidget(data)
  }
  
  @InvalidatesCache(['widgets', 'all-widgets', 'widget-detail', 'widget-by-type', 'page-widgets'])
  async deleteWidget(id: number): Promise<ServiceResult<boolean>> {
    return super.deleteWidget(id)
  }
  
  @InvalidatesCache(['widgets', 'all-widgets', 'widget-detail', 'page-widgets'])
  async updateWidgetPosition(
    id: number, 
    row: number, 
    col: number, 
    rowSpan?: number, 
    colSpan?: number
  ): Promise<ServiceResult<WidgetInstance>> {
    return super.updateWidgetPosition(id, row, col, rowSpan, colSpan)
  }
  
  @InvalidatesCache(['widgets', 'all-widgets', 'widget-detail'])
  async updateWidgetConfig(id: number, config: unknown): Promise<ServiceResult<WidgetInstance>> {
    return super.updateWidgetConfig(id, config)
  }
  
  @InvalidatesCache(['widgets', 'all-widgets', 'widget-detail', 'page-widgets'])
  async batchUpdateWidgets(updates: BatchUpdateWidgetRequest[]): Promise<ServiceListResult<WidgetInstance>> {
    return super.batchUpdateWidgets(updates)
  }
  
  @InvalidatesCache(['widgets', 'all-widgets', 'page-widgets'])
  async duplicateWidget(id: number): Promise<ServiceResult<WidgetInstance>> {
    return super.duplicateWidget(id)
  }
}