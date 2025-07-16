import type { 
  ITodoListService, 
  ServiceResult, 
  ServiceListResult,
  ILoggerService
} from './interfaces'
import type { ITodoListRepository } from '@/lib/repositories/interfaces'
import type { 
  TodoList, 
  TodoListWithItems,
  CreateTodoListRequest,
  UpdateTodoListRequest
} from '@/types/todo'
import { BaseService } from './BaseService'

export class TodoListService extends BaseService implements ITodoListService {
  protected readonly entityName = 'TodoList'
  
  constructor(
    private readonly todoListRepository: ITodoListRepository,
    logger?: ILoggerService
  ) {
    super(logger)
  }

  async getAllTodoLists(): Promise<ServiceListResult<TodoListWithItems>> {
    try {
      this.logOperation('getAllTodoLists')
      
      const lists = await this.todoListRepository.findAllWithItems()
      
      return this.successList(lists)
    } catch (error) {
      return this.handleListError(error, 'fetch todo lists')
    }
  }

  async getTodoListById(id: number): Promise<ServiceResult<TodoListWithItems>> {
    try {
      this.logOperation('getTodoListById', { id })
      
      const list = await this.todoListRepository.findWithItems(id)
      
      if (!list) {
        return this.notFound(id)
      }

      return this.success(list)
    } catch (error) {
      return this.handleError(error, 'fetch todo list')
    }
  }

  async createTodoList(data: CreateTodoListRequest): Promise<ServiceResult<TodoList>> {
    try {
      this.logOperation('createTodoList', data)
      
      const list = await this.todoListRepository.create(data)
      
      return this.success(list)
    } catch (error) {
      return this.handleError(error, 'create todo list')
    }
  }

  async updateTodoList(id: number, data: UpdateTodoListRequest): Promise<ServiceResult<TodoList>> {
    try {
      this.logOperation('updateTodoList', { id, ...data })
      
      const list = await this.todoListRepository.update(id, data)
      
      return this.success(list)
    } catch (error) {
      return this.handleError(error, 'update todo list')
    }
  }

  async deleteTodoList(id: number): Promise<ServiceResult<boolean>> {
    try {
      this.logOperation('deleteTodoList', { id })
      
      const deleted = await this.todoListRepository.delete(id)
      
      return this.success(deleted)
    } catch (error) {
      return this.handleError(error, 'delete todo list')
    }
  }
}