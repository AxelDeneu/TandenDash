import { PageService } from './PageService'
import { CacheableService, CacheResult, InvalidatesCache } from '../cache/service-cache'
import type { IPageService, ServiceResult, ServiceListResult } from './interfaces'
import type { IPageRepository, IWidgetRepository } from '@/lib/repositories/interfaces'
import type { 
  Page, 
  PageWithWidgets,
  CreatePageRequest, 
  UpdatePageRequest 
} from '@/types/page'

export class PageServiceWithCache extends PageService implements IPageService {
  private _cache: any // Cache manager will be injected by decorators
  
  constructor(
    pageRepository: IPageRepository,
    widgetRepository: IWidgetRepository
  ) {
    super(pageRepository, widgetRepository)
  }
  
  @CacheResult({
    ttl: 5 * 60 * 1000, // 5 minutes
    tags: ['pages', 'all-pages']
  })
  async getAllPages(): Promise<ServiceListResult<Page>> {
    return super.getAllPages()
  }
  
  @CacheResult({
    ttl: 5 * 60 * 1000, // 5 minutes
    tags: ['pages', 'page-detail']
  })
  async getPageById(id: number): Promise<ServiceResult<Page>> {
    return super.getPageById(id)
  }
  
  @CacheResult({
    ttl: 2 * 60 * 1000, // 2 minutes (shorter because includes widgets)
    tags: ['pages', 'page-widgets', 'widgets']
  })
  async getPageWithWidgets(id: number): Promise<ServiceResult<PageWithWidgets>> {
    return super.getPageWithWidgets(id)
  }
  
  @InvalidatesCache(['pages', 'all-pages'])
  async createPage(data: CreatePageRequest): Promise<ServiceResult<Page>> {
    return super.createPage(data)
  }
  
  @InvalidatesCache(['pages', 'all-pages', 'page-detail', 'page-widgets'])
  async updatePage(id: number, data: UpdatePageRequest): Promise<ServiceResult<Page>> {
    return super.updatePage(id, data)
  }
  
  @InvalidatesCache(['pages', 'all-pages', 'page-detail', 'page-widgets', 'widgets'])
  async deletePage(id: number): Promise<ServiceResult<boolean>> {
    return super.deletePage(id)
  }
  
  @InvalidatesCache(['pages', 'page-detail', 'page-widgets'])
  async updateGridSettings(
    id: number, 
    gridRows: number, 
    gridCols: number, 
    snapping: boolean
  ): Promise<ServiceResult<Page>> {
    return super.updateGridSettings(id, gridRows, gridCols, snapping)
  }
  
  @CacheResult({
    ttl: 10 * 60 * 1000, // 10 minutes (validation results are stable)
    tags: ['page-validation']
  })
  async validatePageName(name: string, excludeId?: number): Promise<ServiceResult<boolean>> {
    return super.validatePageName(name, excludeId)
  }
}