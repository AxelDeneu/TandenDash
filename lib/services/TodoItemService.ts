import type { 
  ITodoItemService, 
  ServiceResult, 
  ServiceListResult,
  ILoggerService
} from './interfaces'
import type { ITodoItemRepository } from '@/lib/repositories/interfaces'
import type { 
  TodoItem, 
  CreateTodoItemRequest,
  UpdateTodoItemRequest,
  BatchUpdateTodoItemsRequest
} from '@/types/todo'
import { BaseService } from './BaseService'

export class TodoItemService extends BaseService implements ITodoItemService {
  protected readonly entityName = 'TodoItem'
  
  constructor(
    private readonly todoItemRepository: ITodoItemRepository,
    logger?: ILoggerService
  ) {
    super(logger)
  }

  async getTodoItemsByListId(listId: number): Promise<ServiceListResult<TodoItem>> {
    try {
      this.logOperation('getTodoItemsByListId', { listId })
      
      const items = await this.todoItemRepository.findByListId(listId)
      
      return this.successList(items)
    } catch (error) {
      return this.handleListError(error, 'fetch todo items')
    }
  }

  async getTodoItemById(id: number): Promise<ServiceResult<TodoItem>> {
    try {
      this.logOperation('getTodoItemById', { id })
      
      const item = await this.todoItemRepository.findById(id)
      
      if (!item) {
        return this.notFound(id)
      }

      return this.success(item)
    } catch (error) {
      return this.handleError(error, 'fetch todo item')
    }
  }

  async createTodoItem(data: CreateTodoItemRequest): Promise<ServiceResult<TodoItem>> {
    try {
      this.logOperation('createTodoItem', data)
      
      const item = await this.todoItemRepository.create(data)
      
      return this.success(item)
    } catch (error) {
      return this.handleError(error, 'create todo item')
    }
  }

  async updateTodoItem(id: number, data: UpdateTodoItemRequest): Promise<ServiceResult<TodoItem>> {
    try {
      this.logOperation('updateTodoItem', { id, ...data })
      
      const item = await this.todoItemRepository.update(id, data)
      
      return this.success(item)
    } catch (error) {
      return this.handleError(error, 'update todo item')
    }
  }

  async deleteTodoItem(id: number): Promise<ServiceResult<boolean>> {
    try {
      this.logOperation('deleteTodoItem', { id })
      
      const deleted = await this.todoItemRepository.delete(id)
      
      if (!deleted) {
        return this.notFound(id)
      }

      return this.success(true)
    } catch (error) {
      return this.handleError(error, 'delete todo item')
    }
  }

  async batchUpdateTodoItems(updates: BatchUpdateTodoItemsRequest): Promise<ServiceListResult<TodoItem>> {
    try {
      this.logOperation('batchUpdateTodoItems', { count: updates.items.length })
      
      const items = await this.todoItemRepository.batchUpdate(updates)
      
      return this.successList(items)
    } catch (error) {
      return this.handleListError(error, 'batch update todo items')
    }
  }

  async reorderTodoItems(items: Array<{ id: number; position: number }>): Promise<ServiceListResult<TodoItem>> {
    try {
      this.logOperation('reorderTodoItems', { count: items.length })
      
      const reorderedItems = await this.todoItemRepository.updatePositions(items)
      
      return this.successList(reorderedItems)
    } catch (error) {
      return this.handleListError(error, 'reorder todo items')
    }
  }

  async toggleTodoItemComplete(id: number): Promise<ServiceResult<TodoItem>> {
    try {
      this.logOperation('toggleTodoItemComplete', { id })
      
      const current = await this.todoItemRepository.findById(id)
      if (!current) {
        return this.notFound(id)
      }

      const item = current.checked 
        ? await this.todoItemRepository.markUncompleted(id)
        : await this.todoItemRepository.markCompleted(id)
      
      this.logger?.info('Todo item completion toggled', { 
        id, 
        checked: item.checked 
      }, {
        module: 'todoItem',
        method: 'toggleTodoItemComplete'
      })
      
      return this.success(item)
    } catch (error) {
      return this.handleError(error, 'toggle todo item completion')
    }
  }
}