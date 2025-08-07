import { vi } from 'vitest'
import type {
  IWidgetRepository,
  IPageRepository,
  IDashboardRepository,
  IDashboardSettingsRepository,
  IWidgetDataRepository,
  ITodoListRepository,
  ITodoItemRepository,
  IModeStateRepository,
  IRepositoryFactory
} from '@/lib/repositories/interfaces'
import type {
  IWidgetService,
  IPageService,
  IDashboardService,
  IDashboardSettingsService,
  IWidgetDataService,
  ITodoListService,
  ITodoItemService,
  IModeService,
  ILoggerService,
  IServiceFactory
} from '@/lib/services/interfaces'

// Repository Mocks
export function createMockWidgetRepository(): IWidgetRepository {
  return {
    findById: vi.fn(),
    findAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findByPageId: vi.fn(),
    findByType: vi.fn(),
    bulkUpdate: vi.fn()
  }
}

export function createMockPageRepository(): IPageRepository {
  return {
    findById: vi.fn(),
    findAll: vi.fn(),
    findByDashboardId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findByName: vi.fn(),
    findWithWidgets: vi.fn(),
    updateGridSettings: vi.fn()
  }
}

export function createMockDashboardRepository(): IDashboardRepository {
  return {
    findAll: vi.fn(),
    findById: vi.fn(),
    findByName: vi.fn(),
    findDefault: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    setDefault: vi.fn()
  }
}

export function createMockDashboardSettingsRepository(): IDashboardSettingsRepository {
  return {
    findByDashboardId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
}

export function createMockWidgetDataRepository(): IWidgetDataRepository {
  return {
    findByWidgetInstanceId: vi.fn(),
    findByKey: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    deleteAll: vi.fn()
  }
}

export function createMockTodoListRepository(): ITodoListRepository {
  return {
    findById: vi.fn(),
    findAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findWithItems: vi.fn(),
    findAllWithItems: vi.fn()
  }
}

export function createMockTodoItemRepository(): ITodoItemRepository {
  return {
    findById: vi.fn(),
    findAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findByListId: vi.fn(),
    updatePositions: vi.fn(),
    batchUpdate: vi.fn(),
    markCompleted: vi.fn(),
    markUncompleted: vi.fn()
  }
}

export function createMockModeStateRepository(): IModeStateRepository {
  return {
    getCurrentMode: vi.fn(),
    setMode: vi.fn()
  }
}

export function createMockRepositoryFactory(): IRepositoryFactory {
  return {
    createWidgetRepository: vi.fn(() => createMockWidgetRepository()),
    createPageRepository: vi.fn(() => createMockPageRepository()),
    createTodoListRepository: vi.fn(() => createMockTodoListRepository()),
    createTodoItemRepository: vi.fn(() => createMockTodoItemRepository()),
    createModeStateRepository: vi.fn(() => createMockModeStateRepository()),
    createDashboardRepository: vi.fn(() => createMockDashboardRepository()),
    createDashboardSettingsRepository: vi.fn(() => createMockDashboardSettingsRepository()),
    createWidgetDataRepository: vi.fn(() => createMockWidgetDataRepository())
  }
}

// Service Mocks
export function createMockLoggerService(): ILoggerService {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    setLogLevel: vi.fn(),
    getLogLevel: vi.fn(() => 'info'),
    getHistory: vi.fn(() => []),
    clearHistory: vi.fn(),
    time: vi.fn(() => vi.fn()),
    logApiRequest: vi.fn(),
    logApiResponse: vi.fn(),
    logWidgetEvent: vi.fn(),
    devLog: vi.fn()
  }
}

export function createMockWidgetService(): IWidgetService {
  return {
    getAllWidgets: vi.fn(),
    getWidgetById: vi.fn(),
    createWidget: vi.fn(),
    updateWidget: vi.fn(),
    deleteWidget: vi.fn(),
    getWidgetsByType: vi.fn(),
    bulkUpdateWidgets: vi.fn(),
    parseWidgetInstance: vi.fn()
  }
}

export function createMockPageService(): IPageService {
  return {
    getAllPages: vi.fn(),
    getPagesByDashboardId: vi.fn(),
    getPageById: vi.fn(),
    getPageWithWidgets: vi.fn(),
    createPage: vi.fn(),
    updatePage: vi.fn(),
    deletePage: vi.fn(),
    updateGridSettings: vi.fn(),
    validatePageName: vi.fn()
  }
}

export function createMockDashboardService(): IDashboardService {
  return {
    findAll: vi.fn(),
    findById: vi.fn(),
    findDefault: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    setDefault: vi.fn(),
    duplicateDashboard: vi.fn()
  }
}

export function createMockDashboardSettingsService(): IDashboardSettingsService {
  return {
    findByDashboardId: vi.fn(),
    update: vi.fn(),
    ensureSettingsExist: vi.fn()
  }
}

export function createMockWidgetDataService(): IWidgetDataService {
  return {
    getAllData: vi.fn(),
    getData: vi.fn(),
    getValue: vi.fn(),
    setData: vi.fn(),
    updateData: vi.fn(),
    deleteData: vi.fn(),
    deleteAllData: vi.fn(),
    setMultiple: vi.fn(),
    getMultiple: vi.fn()
  }
}

export function createMockTodoListService(): ITodoListService {
  return {
    getAllTodoLists: vi.fn(),
    getTodoListById: vi.fn(),
    createTodoList: vi.fn(),
    updateTodoList: vi.fn(),
    deleteTodoList: vi.fn()
  }
}

export function createMockTodoItemService(): ITodoItemService {
  return {
    getTodoItemsByListId: vi.fn(),
    getTodoItemById: vi.fn(),
    createTodoItem: vi.fn(),
    updateTodoItem: vi.fn(),
    deleteTodoItem: vi.fn(),
    batchUpdateTodoItems: vi.fn(),
    reorderTodoItems: vi.fn(),
    toggleTodoItemComplete: vi.fn()
  }
}

export function createMockModeService(): IModeService {
  return {
    getCurrentMode: vi.fn(),
    setMode: vi.fn(),
    toggleMode: vi.fn()
  }
}

export function createMockServiceFactory(): IServiceFactory {
  return {
    createWidgetService: vi.fn(() => createMockWidgetService()),
    createPageService: vi.fn(() => createMockPageService()),
    createTodoListService: vi.fn(() => createMockTodoListService()),
    createTodoItemService: vi.fn(() => createMockTodoItemService()),
    createModeService: vi.fn(() => createMockModeService()),
    createLoggerService: vi.fn(() => createMockLoggerService()),
    createDashboardService: vi.fn(() => createMockDashboardService()),
    createDashboardSettingsService: vi.fn(() => createMockDashboardSettingsService()),
    createWidgetDataService: vi.fn(() => createMockWidgetDataService())
  }
}