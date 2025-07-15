import type { IServiceFactory, ILoggerService } from './interfaces'
import type { IRepositoryFactory } from '@/lib/repositories/interfaces'
import { WidgetService } from './WidgetService'
import { PageService } from './PageService'
// import { WidgetServiceWithCache } from './WidgetServiceWithCache'
// import { PageServiceWithCache } from './PageServiceWithCache'
import { TodoListService, TodoItemService } from './TodoService'
import { ModeService } from './ModeService'
import { LoggerService } from './LoggerService'

export class ServiceFactory implements IServiceFactory {
  constructor(
    private readonly repositoryFactory: IRepositoryFactory,
    private readonly useCache: boolean = false // Temporarily disabled due to decorator issue
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
      this.widgetService = new WidgetService(widgetRepository)
    }
    return this.widgetService
  }

  createPageService() {
    if (!this.pageService) {
      const pageRepository = this.repositoryFactory.createPageRepository()
      const widgetRepository = this.repositoryFactory.createWidgetRepository()
      this.pageService = new PageService(pageRepository, widgetRepository)
    }
    return this.pageService
  }

  createTodoListService() {
    if (!this.todoListService) {
      const todoListRepository = this.repositoryFactory.createTodoListRepository()
      this.todoListService = new TodoListService(todoListRepository)
    }
    return this.todoListService
  }

  createTodoItemService() {
    if (!this.todoItemService) {
      const todoItemRepository = this.repositoryFactory.createTodoItemRepository()
      this.todoItemService = new TodoItemService(todoItemRepository)
    }
    return this.todoItemService
  }

  createModeService() {
    if (!this.modeService) {
      const modeStateRepository = this.repositoryFactory.createModeStateRepository()
      this.modeService = new ModeService(modeStateRepository)
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

  // Method to clear singleton instances (useful for testing)
  clearInstances() {
    this.widgetService = undefined
    this.pageService = undefined
    this.todoListService = undefined
    this.todoItemService = undefined
    this.modeService = undefined
    this.loggerService = undefined
  }
}