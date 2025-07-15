import type { 
  ITodoListService, 
  ITodoItemService, 
  ServiceResult, 
  ServiceListResult 
} from './interfaces'
import type { 
  ITodoListRepository, 
  ITodoItemRepository 
} from '@/lib/repositories/interfaces'
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

export class TodoListService implements ITodoListService {
  constructor(private readonly todoListRepository: ITodoListRepository) {}

  async getAllTodoLists(): Promise<ServiceListResult<TodoListWithItems>> {
    try {
      const lists = await this.todoListRepository.findAllWithItems()
      
      return {
        success: true,
        data: lists,
        total: lists.length
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch todo lists'
      }
    }
  }

  async getTodoListById(id: number): Promise<ServiceResult<TodoListWithItems>> {
    try {
      const list = await this.todoListRepository.findWithItems(id)
      
      if (!list) {
        return {
          success: false,
          error: `Todo list with id ${id} not found`
        }
      }

      return {
        success: true,
        data: list
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch todo list'
      }
    }
  }

  async createTodoList(data: CreateTodoListRequest): Promise<ServiceResult<TodoList>> {
    try {
      const list = await this.todoListRepository.create(data)
      
      return {
        success: true,
        data: list
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create todo list'
      }
    }
  }

  async updateTodoList(id: number, data: UpdateTodoListRequest): Promise<ServiceResult<TodoList>> {
    try {
      const list = await this.todoListRepository.update(id, data)
      
      return {
        success: true,
        data: list
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update todo list'
      }
    }
  }

  async deleteTodoList(id: number): Promise<ServiceResult<boolean>> {
    try {
      const deleted = await this.todoListRepository.delete(id)
      
      return {
        success: true,
        data: deleted
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete todo list'
      }
    }
  }
}

export class TodoItemService implements ITodoItemService {
  constructor(private readonly todoItemRepository: ITodoItemRepository) {}

  async getTodoItemsByListId(listId: number): Promise<ServiceListResult<TodoItem>> {
    try {
      const items = await this.todoItemRepository.findByListId(listId)
      
      return {
        success: true,
        data: items,
        total: items.length
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch todo items'
      }
    }
  }

  async getTodoItemById(id: number): Promise<ServiceResult<TodoItem>> {
    try {
      const item = await this.todoItemRepository.findById(id)
      
      if (!item) {
        return {
          success: false,
          error: `Todo item with id ${id} not found`
        }
      }

      return {
        success: true,
        data: item
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch todo item'
      }
    }
  }

  async createTodoItem(data: CreateTodoItemRequest): Promise<ServiceResult<TodoItem>> {
    try {
      const item = await this.todoItemRepository.create(data)
      
      return {
        success: true,
        data: item
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create todo item'
      }
    }
  }

  async updateTodoItem(id: number, data: UpdateTodoItemRequest): Promise<ServiceResult<TodoItem>> {
    try {
      const item = await this.todoItemRepository.update(id, data)
      
      return {
        success: true,
        data: item
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update todo item'
      }
    }
  }

  async deleteTodoItem(id: number): Promise<ServiceResult<boolean>> {
    try {
      const deleted = await this.todoItemRepository.delete(id)
      
      if (!deleted) {
        return {
          success: false,
          error: `Todo item with id ${id} not found`
        }
      }

      return {
        success: true,
        data: true
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete todo item'
      }
    }
  }

  async batchUpdateTodoItems(updates: BatchUpdateTodoItemsRequest): Promise<ServiceListResult<TodoItem>> {
    try {
      const items = await this.todoItemRepository.batchUpdate(updates)
      
      return {
        success: true,
        data: items,
        total: items.length
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to batch update todo items'
      }
    }
  }

  async reorderTodoItems(items: Array<{ id: number; position: number }>): Promise<ServiceListResult<TodoItem>> {
    try {
      const reorderedItems = await this.todoItemRepository.updatePositions(items)
      
      return {
        success: true,
        data: reorderedItems,
        total: reorderedItems.length
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reorder todo items'
      }
    }
  }

  async toggleTodoItemComplete(id: number): Promise<ServiceResult<TodoItem>> {
    try {
      const current = await this.todoItemRepository.findById(id)
      if (!current) {
        return {
          success: false,
          error: `Todo item with id ${id} not found`
        }
      }

      const item = current.checked 
        ? await this.todoItemRepository.markUncompleted(id)
        : await this.todoItemRepository.markCompleted(id)
      
      return {
        success: true,
        data: item
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to toggle todo item completion'
      }
    }
  }
}