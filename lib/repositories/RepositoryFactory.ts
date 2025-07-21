import type { IRepositoryFactory } from './interfaces'
import { WidgetRepository } from './WidgetRepository'
import { PageRepository } from './PageRepository'
import { TodoListRepository, TodoItemRepository } from './TodoRepository'
import { ModeStateRepository } from './ModeStateRepository'
import { DashboardRepository } from './DashboardRepository'
import { DashboardSettingsRepository } from './DashboardSettingsRepository'
import { db } from '../db'

export class RepositoryFactory implements IRepositoryFactory {
  // Singleton instances for repository reuse
  private static widgetRepository?: WidgetRepository
  private static pageRepository?: PageRepository
  private static todoListRepository?: TodoListRepository
  private static todoItemRepository?: TodoItemRepository
  private static modeStateRepository?: ModeStateRepository
  private static dashboardRepository?: DashboardRepository
  private static dashboardSettingsRepository?: DashboardSettingsRepository

  createWidgetRepository() {
    if (!RepositoryFactory.widgetRepository) {
      RepositoryFactory.widgetRepository = new WidgetRepository()
    }
    return RepositoryFactory.widgetRepository
  }

  createPageRepository() {
    if (!RepositoryFactory.pageRepository) {
      RepositoryFactory.pageRepository = new PageRepository()
    }
    return RepositoryFactory.pageRepository
  }

  createTodoListRepository() {
    if (!RepositoryFactory.todoListRepository) {
      RepositoryFactory.todoListRepository = new TodoListRepository()
    }
    return RepositoryFactory.todoListRepository
  }

  createTodoItemRepository() {
    if (!RepositoryFactory.todoItemRepository) {
      RepositoryFactory.todoItemRepository = new TodoItemRepository()
    }
    return RepositoryFactory.todoItemRepository
  }

  createModeStateRepository() {
    if (!RepositoryFactory.modeStateRepository) {
      RepositoryFactory.modeStateRepository = new ModeStateRepository()
    }
    return RepositoryFactory.modeStateRepository
  }

  createDashboardRepository() {
    if (!RepositoryFactory.dashboardRepository) {
      RepositoryFactory.dashboardRepository = new DashboardRepository()
    }
    return RepositoryFactory.dashboardRepository
  }

  createDashboardSettingsRepository() {
    if (!RepositoryFactory.dashboardSettingsRepository) {
      RepositoryFactory.dashboardSettingsRepository = new DashboardSettingsRepository()
    }
    return RepositoryFactory.dashboardSettingsRepository
  }

  // Method to clear singleton instances (useful for testing)
  static clearInstances() {
    RepositoryFactory.widgetRepository = undefined
    RepositoryFactory.pageRepository = undefined
    RepositoryFactory.todoListRepository = undefined
    RepositoryFactory.todoItemRepository = undefined
    RepositoryFactory.modeStateRepository = undefined
    RepositoryFactory.dashboardRepository = undefined
    RepositoryFactory.dashboardSettingsRepository = undefined
  }
}

// Default factory instance
export const repositoryFactory = new RepositoryFactory()