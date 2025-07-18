import type { 
  WidgetInstance, 
  CreateWidgetRequest, 
  UpdateWidgetRequest 
} from '@/types/widget'
import type { 
  Page, 
  CreatePageRequest, 
  UpdatePageRequest 
} from '@/types/page'
import type { 
  TodoList, 
  TodoItem, 
  TodoListWithItems,
  CreateTodoListRequest,
  UpdateTodoListRequest,
  CreateTodoItemRequest,
  UpdateTodoItemRequest,
  BatchUpdateTodoItemsRequest
} from '@/types/todo'

// Widget repository interface
export interface IWidgetRepository {
  findById(id: number): Promise<WidgetInstance | null>
  findAll(): Promise<WidgetInstance[]>
  create(data: CreateWidgetRequest): Promise<WidgetInstance>
  update(id: number, data: UpdateWidgetRequest): Promise<WidgetInstance>
  delete(id: number): Promise<boolean>
  findByPageId(pageId: number): Promise<WidgetInstance[]>
  findByType(type: string): Promise<WidgetInstance[]>
  bulkUpdate(widgets: Array<{ id: number; position?: string; options?: string }>): Promise<WidgetInstance[]>
}

// Page repository interface
export interface IPageRepository {
  findById(id: number): Promise<Page | null>
  findAll(): Promise<Page[]>
  create(data: CreatePageRequest): Promise<Page>
  update(id: number, data: UpdatePageRequest): Promise<Page>
  delete(id: number): Promise<boolean>
  findByName(name: string): Promise<Page | null>
  findWithWidgets(id: number): Promise<Page & { widgets: WidgetInstance[] } | null>
  updateGridSettings(id: number, gridRows: number, gridCols: number, snapping: boolean): Promise<Page>
}

// Todo repository interfaces
export interface ITodoListRepository {
  findById(id: number): Promise<TodoList | null>
  findAll(): Promise<TodoList[]>
  create(data: CreateTodoListRequest): Promise<TodoList>
  update(id: number, data: UpdateTodoListRequest): Promise<TodoList>
  delete(id: number): Promise<boolean>
  findWithItems(id: number): Promise<TodoListWithItems | null>
  findAllWithItems(): Promise<TodoListWithItems[]>
}

export interface ITodoItemRepository {
  findById(id: number): Promise<TodoItem | null>
  findAll(): Promise<TodoItem[]>
  create(data: CreateTodoItemRequest): Promise<TodoItem>
  update(id: number, data: UpdateTodoItemRequest): Promise<TodoItem>
  delete(id: number): Promise<boolean>
  findByListId(listId: number): Promise<TodoItem[]>
  updatePositions(items: Array<{ id: number; position: number }>): Promise<TodoItem[]>
  batchUpdate(updates: BatchUpdateTodoItemsRequest): Promise<TodoItem[]>
  markCompleted(id: number): Promise<TodoItem>
  markUncompleted(id: number): Promise<TodoItem>
}

// Mode state repository interface
export interface IModeStateRepository {
  getCurrentMode(): Promise<'light' | 'dark'>
  setMode(mode: 'light' | 'dark'): Promise<void>
}

// Repository factory interface for dependency injection
export interface IRepositoryFactory {
  createWidgetRepository(): IWidgetRepository
  createPageRepository(): IPageRepository
  createTodoListRepository(): ITodoListRepository
  createTodoItemRepository(): ITodoItemRepository
  createModeStateRepository(): IModeStateRepository
}