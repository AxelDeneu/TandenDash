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

// Base repository interface
export interface BaseRepository<TEntity, TCreateRequest, TUpdateRequest> {
  findById(id: number): Promise<TEntity | null>
  findAll(): Promise<TEntity[]>
  create(data: TCreateRequest): Promise<TEntity>
  update(id: number, data: TUpdateRequest): Promise<TEntity>
  delete(id: number): Promise<boolean>
}

// Widget repository interface
export interface IWidgetRepository extends BaseRepository<WidgetInstance, CreateWidgetRequest, UpdateWidgetRequest> {
  findByPageId(pageId: number): Promise<WidgetInstance[]>
  findByType(type: string): Promise<WidgetInstance[]>
  bulkUpdate(widgets: Array<{ id: number; position?: string; options?: string }>): Promise<WidgetInstance[]>
}

// Page repository interface
export interface IPageRepository extends BaseRepository<Page, CreatePageRequest, UpdatePageRequest> {
  findByName(name: string): Promise<Page | null>
  findWithWidgets(id: number): Promise<Page & { widgets: WidgetInstance[] } | null>
  updateGridSettings(id: number, gridRows: number, gridCols: number, snapping: boolean): Promise<Page>
}

// Todo repository interfaces
export interface ITodoListRepository extends BaseRepository<TodoList, CreateTodoListRequest, UpdateTodoListRequest> {
  findWithItems(id: number): Promise<TodoListWithItems | null>
  findAllWithItems(): Promise<TodoListWithItems[]>
}

export interface ITodoItemRepository extends BaseRepository<TodoItem, CreateTodoItemRequest, UpdateTodoItemRequest> {
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