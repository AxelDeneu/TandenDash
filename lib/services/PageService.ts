import type { IPageService, ServiceResult, ServiceListResult } from './interfaces'
import type { IPageRepository, IWidgetRepository } from '@/lib/repositories/interfaces'
import type { 
  Page, 
  PageWithWidgets,
  CreatePageRequest, 
  UpdatePageRequest 
} from '@/types/page'

export class PageService implements IPageService {
  constructor(
    private readonly pageRepository: IPageRepository,
    private readonly widgetRepository: IWidgetRepository
  ) {}

  async getAllPages(): Promise<ServiceListResult<Page>> {
    try {
      const pages = await this.pageRepository.findAll()
      
      return {
        success: true,
        data: pages,
        total: pages.length
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch pages'
      }
    }
  }

  async getPageById(id: number): Promise<ServiceResult<Page>> {
    try {
      const page = await this.pageRepository.findById(id)
      
      if (!page) {
        return {
          success: false,
          error: `Page with id ${id} not found`
        }
      }

      return {
        success: true,
        data: page
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch page'
      }
    }
  }

  async getPageWithWidgets(id: number): Promise<ServiceResult<PageWithWidgets>> {
    try {
      const page = await this.pageRepository.findById(id)
      if (!page) {
        return {
          success: false,
          error: `Page with id ${id} not found`
        }
      }

      const widgets = await this.widgetRepository.findByPageId(id)
      
      const pageWithWidgets: PageWithWidgets = {
        ...page,
        widgets
      }

      return {
        success: true,
        data: pageWithWidgets
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch page with widgets'
      }
    }
  }

  async createPage(data: CreatePageRequest): Promise<ServiceResult<Page>> {
    try {
      // Additional business logic validation
      await this.validatePageName(data.name)
      
      const page = await this.pageRepository.create(data)
      
      return {
        success: true,
        data: page
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create page'
      }
    }
  }

  async updatePage(id: number, data: UpdatePageRequest): Promise<ServiceResult<Page>> {
    try {
      console.log('[PageService] updatePage - id:', id, 'data:', JSON.stringify(data))
      console.log('[PageService] snapping value specifically:', data.snapping)
      
      // Validate name if it's being updated
      if (data.name) {
        const nameValidation = await this.validatePageName(data.name, id)
        if (!nameValidation.success) {
          return nameValidation as ServiceResult<Page>
        }
      }
      
      const page = await this.pageRepository.update(id, data)
      console.log('[PageService] Updated page from repository:', JSON.stringify(page))
      
      return {
        success: true,
        data: page
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update page'
      }
    }
  }

  async deletePage(id: number): Promise<ServiceResult<boolean>> {
    try {
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
        return {
          success: false,
          error: `Page with id ${id} not found`
        }
      }

      return {
        success: true,
        data: true
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete page'
      }
    }
  }

  async updateGridSettings(
    id: number, 
    gridRows: number, 
    gridCols: number, 
    snapping: boolean
  ): Promise<ServiceResult<Page>> {
    try {
      const page = await this.pageRepository.updateGridSettings(id, gridRows, gridCols, snapping)
      
      return {
        success: true,
        data: page
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update grid settings'
      }
    }
  }

  async validatePageName(name: string, excludeId?: number): Promise<ServiceResult<boolean>> {
    try {
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

      return {
        success: true,
        data: true
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to validate page name'
      }
    }
  }
}