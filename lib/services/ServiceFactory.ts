import type { IServiceFactory, ILoggerService } from './interfaces'
import type { IRepositoryFactory } from '@/lib/repositories/interfaces'
import { WidgetService } from './WidgetService'
import { PageService } from './PageService'
import { TodoListService } from './TodoListService'
import { TodoItemService } from './TodoItemService'
import { ModeService } from './ModeService'
import { LoggerService } from './LoggerService'

export class ServiceFactory implements IServiceFactory {
  constructor(
    private readonly repositoryFactory: IRepositoryFactory,
  ) {}

  // Singleton instances for service reuse
  private widgetService?: WidgetService
  private pageService?: PageService
  private todoListService?: TodoListService
  private todoItemService?: TodoItemService
  private modeService?: ModeService
  private loggerService?: ILoggerService

  createWidgetService() {
    if (!this.widgetService) {
      const widgetRepository = this.repositoryFactory.createWidgetRepository()
      const logger = this.createLoggerService()
      this.widgetService = new WidgetService(widgetRepository, logger)
    }
    return this.widgetService
  }

  createPageService() {
    if (!this.pageService) {
      const pageRepository = this.repositoryFactory.createPageRepository()
      const widgetRepository = this.repositoryFactory.createWidgetRepository()
      const logger = this.createLoggerService()
      this.pageService = new PageService(pageRepository, widgetRepository, logger)
    }
    return this.pageService
  }

  createTodoListService() {
    if (!this.todoListService) {
      const todoListRepository = this.repositoryFactory.createTodoListRepository()
      const logger = this.createLoggerService()
      this.todoListService = new TodoListService(todoListRepository, logger)
    }
    return this.todoListService
  }

  createTodoItemService() {
    if (!this.todoItemService) {
      const todoItemRepository = this.repositoryFactory.createTodoItemRepository()
      const logger = this.createLoggerService()
      this.todoItemService = new TodoItemService(todoItemRepository, logger)
    }
    return this.todoItemService
  }

  createModeService() {
    if (!this.modeService) {
      const modeStateRepository = this.repositoryFactory.createModeStateRepository()
      const logger = this.createLoggerService()
      this.modeService = new ModeService(modeStateRepository, logger)
    }
    return this.modeService
  }

  createLoggerService() {
    if (!this.loggerService) {
      const logLevel = process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error' || 'info'
      this.loggerService = new LoggerService(logLevel)
    }
    return this.loggerService
  }
}