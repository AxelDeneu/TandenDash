import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TodoListService } from '@/lib/services/TodoListService'
import { createMockTodoListRepository, createMockLoggerService } from '../helpers/mock-factory'
import type { ITodoListRepository, ILoggerService } from '@/lib/services/interfaces'
import type { TodoList, TodoListWithItems, CreateTodoListRequest, UpdateTodoListRequest } from '@/types/todo'

describe('TodoListService', () => {
  let service: TodoListService
  let mockRepository: ITodoListRepository
  let mockLogger: ILoggerService

  const mockTodoList: TodoList = {
    id: 1,
    name: 'Shopping List',
    widgetInstanceId: 1
  }

  const mockTodoItem = {
    id: 1,
    content: 'Buy milk',
    checked: false,
    position: 1,
    listId: 1
  }

  const mockTodoListWithItems: TodoListWithItems = {
    ...mockTodoList,
    items: [mockTodoItem]
  }

  const mockCreateRequest: CreateTodoListRequest = {
    name: 'New List',
    widgetInstanceId: 1
  }

  const mockUpdateRequest: UpdateTodoListRequest = {
    name: 'Updated List'
  }

  beforeEach(() => {
    mockRepository = createMockTodoListRepository()
    mockLogger = createMockLoggerService()
    service = new TodoListService(mockRepository, mockLogger)
  })

  describe('getAllTodoLists', () => {
    it('should return all todo lists with items successfully', async () => {
      const mockLists = [mockTodoListWithItems]
      vi.mocked(mockRepository.findAllWithItems).mockResolvedValue(mockLists)

      const result = await service.getAllTodoLists()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockLists)
      expect(result.total).toBe(1)
      expect(mockRepository.findAllWithItems).toHaveBeenCalledOnce()
      expect(mockLogger.debug).toHaveBeenCalledWith('TodoList getAllTodoLists', undefined, {
        module: 'todolist',
        method: 'getAllTodoLists'
      })
    })

    it('should handle repository errors', async () => {
      const error = new Error('Database error')
      vi.mocked(mockRepository.findAllWithItems).mockRejectedValue(error)

      const result = await service.getAllTodoLists()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database error')
      expect(mockLogger.error).toHaveBeenCalledWith('TodoList fetch todo lists failed', error, {
        module: 'todolist',
        method: 'fetch todo lists'
      })
    })
  })

  describe('getTodoListById', () => {
    it('should return todo list with items by id successfully', async () => {
      vi.mocked(mockRepository.findWithItems).mockResolvedValue(mockTodoListWithItems)

      const result = await service.getTodoListById(1)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockTodoListWithItems)
      expect(mockRepository.findWithItems).toHaveBeenCalledWith(1)
    })

    it('should return not found when todo list does not exist', async () => {
      vi.mocked(mockRepository.findWithItems).mockResolvedValue(null)

      const result = await service.getTodoListById(999)

      expect(result.success).toBe(false)
      expect(result.error).toBe('TodoList with id 999 not found')
      expect(mockLogger.warn).toHaveBeenCalledWith('TodoList with id 999 not found', { id: 999 }, {
        module: 'todolist',
        method: 'notFound'
      })
    })

    it('should handle repository errors', async () => {
      const error = new Error('Database error')
      vi.mocked(mockRepository.findWithItems).mockRejectedValue(error)

      const result = await service.getTodoListById(1)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database error')
      expect(mockLogger.error).toHaveBeenCalledWith('TodoList fetch todo list failed', error, {
        module: 'todolist',
        method: 'fetch todo list'
      })
    })
  })

  describe('createTodoList', () => {
    it('should create todo list successfully', async () => {
      vi.mocked(mockRepository.create).mockResolvedValue(mockTodoList)

      const result = await service.createTodoList(mockCreateRequest)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockTodoList)
      expect(mockRepository.create).toHaveBeenCalledWith(mockCreateRequest)
      expect(mockLogger.debug).toHaveBeenCalledWith('TodoList createTodoList', mockCreateRequest, {
        module: 'todolist',
        method: 'createTodoList'
      })
    })

    it('should handle repository errors during creation', async () => {
      const error = new Error('Creation failed')
      vi.mocked(mockRepository.create).mockRejectedValue(error)

      const result = await service.createTodoList(mockCreateRequest)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Creation failed')
      expect(mockLogger.error).toHaveBeenCalledWith('TodoList create todo list failed', error, {
        module: 'todolist',
        method: 'create todo list'
      })
    })
  })

  describe('updateTodoList', () => {
    it('should update todo list successfully', async () => {
      const updatedList = { ...mockTodoList, ...mockUpdateRequest }
      vi.mocked(mockRepository.update).mockResolvedValue(updatedList)

      const result = await service.updateTodoList(1, mockUpdateRequest)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(updatedList)
      expect(mockRepository.update).toHaveBeenCalledWith(1, mockUpdateRequest)
    })

    it('should handle repository errors during update', async () => {
      const error = new Error('Update failed')
      vi.mocked(mockRepository.update).mockRejectedValue(error)

      const result = await service.updateTodoList(1, mockUpdateRequest)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Update failed')
      expect(mockLogger.error).toHaveBeenCalledWith('TodoList update todo list failed', error, {
        module: 'todolist',
        method: 'update todo list'
      })
    })
  })

  describe('deleteTodoList', () => {
    it('should delete todo list successfully', async () => {
      vi.mocked(mockRepository.delete).mockResolvedValue(true)

      const result = await service.deleteTodoList(1)

      expect(result.success).toBe(true)
      expect(result.data).toBe(true)
      expect(mockRepository.delete).toHaveBeenCalledWith(1)
    })

    it('should handle repository errors during deletion', async () => {
      const error = new Error('Delete failed')
      vi.mocked(mockRepository.delete).mockRejectedValue(error)

      const result = await service.deleteTodoList(1)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Delete failed')
      expect(mockLogger.error).toHaveBeenCalledWith('TodoList delete todo list failed', error, {
        module: 'todolist',
        method: 'delete todo list'
      })
    })
  })
})