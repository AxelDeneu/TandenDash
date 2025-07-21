import type { IPageService, ServiceResult, ServiceListResult, ILoggerService } from './interfaces'
import type { IPageRepository, IWidgetRepository } from '@/lib/repositories/interfaces'
import type { 
  Page, 
  PageWithWidgets,
  CreatePageRequest, 
  UpdatePageRequest 
} from '@/types/page'
import { BaseService } from './BaseService'

export class PageService extends BaseService implements IPageService {
  protected readonly entityName = 'Page'
  
  constructor(
    private readonly pageRepository: IPageRepository,
    private readonly widgetRepository: IWidgetRepository,
    logger?: ILoggerService
  ) {
    super(logger)
  }

  async getAllPages(): Promise<ServiceListResult<Page>> {
    try {
      this.logOperation('getAllPages')
      
      const pages = await this.pageRepository.findAll()
      
      return this.successList(pages)
    } catch (error) {
      return this.handleListError(error, 'fetch pages')
    }
  }

  async getPagesByDashboardId(dashboardId: number): Promise<ServiceListResult<Page>> {
    try {
      this.logOperation('getPagesByDashboardId', { dashboardId })
      
      const pages = await this.pageRepository.findByDashboardId(dashboardId)
      
      return this.successList(pages)
    } catch (error) {
      return this.handleListError(error, 'fetch pages by dashboard')
    }
  }

  async getPageById(id: number): Promise<ServiceResult<Page>> {
    try {
      this.logOperation('getPageById', { id })
      
      const page = await this.pageRepository.findById(id)
      
      if (!page) {
        return this.notFound(id)
      }

      return this.success(page)
    } catch (error) {
      return this.handleError(error, 'fetch page')
    }
  }

  async getPageWithWidgets(id: number): Promise<ServiceResult<PageWithWidgets>> {
    try {
      this.logOperation('getPageWithWidgets', { id })
      
      const page = await this.pageRepository.findById(id)
      if (!page) {
        return this.notFound(id)
      }

      const widgets = await this.widgetRepository.findByPageId(id)
      
      const pageWithWidgets: PageWithWidgets = {
        ...page,
        widgets
      }

      return this.success(pageWithWidgets)
    } catch (error) {
      return this.handleError(error, 'fetch page with widgets')
    }
  }

  async createPage(data: CreatePageRequest): Promise<ServiceResult<Page>> {
    try {
      this.logOperation('createPage', data)
      
      // Additional business logic validation
      await this.validatePageName(data.name)
      
      const page = await this.pageRepository.create(data)
      
      return this.success(page)
    } catch (error) {
      return this.handleError(error, 'create page')
    }
  }

  async updatePage(id: number, data: UpdatePageRequest): Promise<ServiceResult<Page>> {
    try {
      this.logOperation('updatePage', { id, ...data })
      this.logger?.debug('PageService updatePage - snapping value', { snapping: data.snapping }, {
        module: 'page',
        method: 'updatePage'
      })
      
      // Validate name if it's being updated
      if (data.name) {
        const nameValidation = await this.validatePageName(data.name, id)
        if (!nameValidation.success) {
          return nameValidation as ServiceResult<Page>
        }
      }
      
      const page = await this.pageRepository.update(id, data)
      this.logger?.debug('Updated page from repository', page, {
        module: 'page',
        method: 'updatePage'
      })
      
      return this.success(page)
    } catch (error) {
      return this.handleError(error, 'update page')
    }
  }

  async deletePage(id: number): Promise<ServiceResult<boolean>> {
    try {
      this.logOperation('deletePage', { id })
      
      // Business logic: Check if this is the last page
      const allPages = await this.pageRepository.findAll()
      if (allPages.length <= 1) {
        return {
          success: false,
          error: 'Cannot delete the last remaining page'
        }
      }

      const deleted = await this.pageRepository.delete(id)
      
      if (!deleted) {
        return this.notFound(id)
      }

      return this.success(true)
    } catch (error) {
      return this.handleError(error, 'delete page')
    }
  }

  async updateGridSettings(
    id: number, 
    gridRows: number, 
    gridCols: number, 
    snapping: boolean
  ): Promise<ServiceResult<Page>> {
    try {
      this.logOperation('updateGridSettings', { id, gridRows, gridCols, snapping })
      
      const page = await this.pageRepository.updateGridSettings(id, gridRows, gridCols, snapping)
      
      return this.success(page)
    } catch (error) {
      return this.handleError(error, 'update grid settings')
    }
  }

  async validatePageName(name: string, excludeId?: number): Promise<ServiceResult<boolean>> {
    try {
      this.logOperation('validatePageName', { name, excludeId })
      
      // Validate name format
      if (!name || name.trim().length === 0) {
        return {
          success: false,
          error: 'Page name cannot be empty'
        }
      }

      if (name.length > 255) {
        return {
          success: false,
          error: 'Page name cannot exceed 255 characters'
        }
      }

      // Check for duplicates
      const existing = await this.pageRepository.findByName(name)
      if (existing && existing.id !== excludeId) {
        return {
          success: false,
          error: `Page with name "${name}" already exists`
        }
      }

      return this.success(true)
    } catch (error) {
      return this.handleError(error, 'validate page name')
    }
  }
}