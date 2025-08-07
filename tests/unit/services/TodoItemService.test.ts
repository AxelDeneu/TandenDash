import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TodoItemService } from '@/lib/services/TodoItemService'
import { createMockTodoItemRepository, createMockLoggerService } from '../helpers/mock-factory'
import type { ITodoItemRepository, ILoggerService } from '@/lib/services/interfaces'
import type { TodoItem, CreateTodoItemRequest, UpdateTodoItemRequest, BatchUpdateTodoItemsRequest } from '@/types/todo'

describe('TodoItemService', () => {
  let service: TodoItemService
  let mockRepository: ITodoItemRepository
  let mockLogger: ILoggerService

  const mockTodoItem: TodoItem = {
    id: 1,
    content: 'Buy milk',
    checked: false,
    position: 1,
    listId: 1
  }

  const mockCreateRequest: CreateTodoItemRequest = {
    content: 'Buy bread',
    position: 2,
    listId: 1
  }

  const mockUpdateRequest: UpdateTodoItemRequest = {
    content: 'Buy organic milk',
    position: 1
  }

  const mockBatchUpdateRequest: BatchUpdateTodoItemsRequest = {
    items: [
      { id: 1, content: 'Updated item 1' },
      { id: 2, content: 'Updated item 2' }
    ]
  }

  beforeEach(() => {
    mockRepository = createMockTodoItemRepository()
    mockLogger = createMockLoggerService()
    service = new TodoItemService(mockRepository, mockLogger)
  })

  describe('getTodoItemsByListId', () => {
    it('should return todo items by list id successfully', async () => {
      const mockItems = [mockTodoItem]
      vi.mocked(mockRepository.findByListId).mockResolvedValue(mockItems)

      const result = await service.getTodoItemsByListId(1)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockItems)
      expect(result.total).toBe(1)
      expect(mockRepository.findByListId).toHaveBeenCalledWith(1)
    })

    it('should handle repository errors', async () => {
      const error = new Error('Database error')
      vi.mocked(mockRepository.findByListId).mockRejectedValue(error)

      const result = await service.getTodoItemsByListId(1)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database error')
      expect(mockLogger.error).toHaveBeenCalledWith('TodoItem fetch todo items failed', error, {
        module: 'todoitem',
        method: 'fetch todo items'
      })
    })
  })

  describe('getTodoItemById', () => {
    it('should return todo item by id successfully', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(mockTodoItem)

      const result = await service.getTodoItemById(1)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockTodoItem)
      expect(mockRepository.findById).toHaveBeenCalledWith(1)
    })

    it('should return not found when todo item does not exist', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null)

      const result = await service.getTodoItemById(999)

      expect(result.success).toBe(false)
      expect(result.error).toBe('TodoItem with id 999 not found')
      expect(mockLogger.warn).toHaveBeenCalledWith('TodoItem with id 999 not found', { id: 999 }, {
        module: 'todoitem',
        method: 'notFound'
      })
    })

    it('should handle repository errors', async () => {
      const error = new Error('Database error')
      vi.mocked(mockRepository.findById).mockRejectedValue(error)

      const result = await service.getTodoItemById(1)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database error')
    })
  })

  describe('createTodoItem', () => {
    it('should create todo item successfully', async () => {
      vi.mocked(mockRepository.create).mockResolvedValue(mockTodoItem)

      const result = await service.createTodoItem(mockCreateRequest)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockTodoItem)
      expect(mockRepository.create).toHaveBeenCalledWith(mockCreateRequest)
    })

    it('should handle repository errors during creation', async () => {
      const error = new Error('Creation failed')
      vi.mocked(mockRepository.create).mockRejectedValue(error)

      const result = await service.createTodoItem(mockCreateRequest)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Creation failed')
      expect(mockLogger.error).toHaveBeenCalledWith('TodoItem create todo item failed', error, {
        module: 'todoitem',
        method: 'create todo item'
      })
    })
  })

  describe('updateTodoItem', () => {
    it('should update todo item successfully', async () => {
      const updatedItem = { ...mockTodoItem, ...mockUpdateRequest }
      vi.mocked(mockRepository.update).mockResolvedValue(updatedItem)

      const result = await service.updateTodoItem(1, mockUpdateRequest)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(updatedItem)
      expect(mockRepository.update).toHaveBeenCalledWith(1, mockUpdateRequest)
    })

    it('should handle repository errors during update', async () => {
      const error = new Error('Update failed')
      vi.mocked(mockRepository.update).mockRejectedValue(error)

      const result = await service.updateTodoItem(1, mockUpdateRequest)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Update failed')
    })
  })

  describe('deleteTodoItem', () => {
    it('should delete todo item successfully', async () => {
      vi.mocked(mockRepository.delete).mockResolvedValue(true)

      const result = await service.deleteTodoItem(1)

      expect(result.success).toBe(true)
      expect(result.data).toBe(true)
      expect(mockRepository.delete).toHaveBeenCalledWith(1)
    })

    it('should return not found when todo item to delete does not exist', async () => {
      vi.mocked(mockRepository.delete).mockResolvedValue(false)

      const result = await service.deleteTodoItem(999)

      expect(result.success).toBe(false)
      expect(result.error).toBe('TodoItem with id 999 not found')
    })

    it('should handle repository errors during deletion', async () => {
      const error = new Error('Delete failed')
      vi.mocked(mockRepository.delete).mockRejectedValue(error)

      const result = await service.deleteTodoItem(1)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Delete failed')
    })
  })

  describe('batchUpdateTodoItems', () => {
    it('should batch update todo items successfully', async () => {
      const updatedItems = [
        { ...mockTodoItem, content: 'Updated item 1' },
        { ...mockTodoItem, id: 2, content: 'Updated item 2' }
      ]
      vi.mocked(mockRepository.batchUpdate).mockResolvedValue(updatedItems)

      const result = await service.batchUpdateTodoItems(mockBatchUpdateRequest)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(updatedItems)
      expect(result.total).toBe(2)
      expect(mockRepository.batchUpdate).toHaveBeenCalledWith(mockBatchUpdateRequest)
      expect(mockLogger.debug).toHaveBeenCalledWith('TodoItem batchUpdateTodoItems', { count: 2 }, {
        module: 'todoitem',
        method: 'batchUpdateTodoItems'
      })
    })

    it('should handle repository errors during batch update', async () => {
      const error = new Error('Batch update failed')
      vi.mocked(mockRepository.batchUpdate).mockRejectedValue(error)

      const result = await service.batchUpdateTodoItems(mockBatchUpdateRequest)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Batch update failed')
    })
  })

  describe('reorderTodoItems', () => {
    it('should reorder todo items successfully', async () => {
      const reorderItems = [
        { id: 1, position: 2 },
        { id: 2, position: 1 }
      ]
      const reorderedItems = [
        { ...mockTodoItem, position: 2 },
        { ...mockTodoItem, id: 2, position: 1 }
      ]
      vi.mocked(mockRepository.updatePositions).mockResolvedValue(reorderedItems)

      const result = await service.reorderTodoItems(reorderItems)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(reorderedItems)
      expect(result.total).toBe(2)
      expect(mockRepository.updatePositions).toHaveBeenCalledWith(reorderItems)
    })

    it('should handle repository errors during reordering', async () => {
      const error = new Error('Reorder failed')
      const reorderItems = [{ id: 1, position: 2 }]
      vi.mocked(mockRepository.updatePositions).mockRejectedValue(error)

      const result = await service.reorderTodoItems(reorderItems)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Reorder failed')
    })
  })

  describe('toggleTodoItemComplete', () => {
    it('should toggle todo item to completed successfully', async () => {
      const completedItem = { ...mockTodoItem, checked: true }
      vi.mocked(mockRepository.findById).mockResolvedValue(mockTodoItem)
      vi.mocked(mockRepository.markCompleted).mockResolvedValue(completedItem)

      const result = await service.toggleTodoItemComplete(1)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(completedItem)
      expect(mockRepository.findById).toHaveBeenCalledWith(1)
      expect(mockRepository.markCompleted).toHaveBeenCalledWith(1)
      expect(mockRepository.markUncompleted).not.toHaveBeenCalled()
      expect(mockLogger.info).toHaveBeenCalledWith('Todo item completion toggled', {
        id: 1,
        checked: true
      }, {
        module: 'todoItem',
        method: 'toggleTodoItemComplete'
      })
    })

    it('should toggle todo item to uncompleted successfully', async () => {
      const checkedItem = { ...mockTodoItem, checked: true }
      const uncompletedItem = { ...mockTodoItem, checked: false }
      vi.mocked(mockRepository.findById).mockResolvedValue(checkedItem)
      vi.mocked(mockRepository.markUncompleted).mockResolvedValue(uncompletedItem)

      const result = await service.toggleTodoItemComplete(1)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(uncompletedItem)
      expect(mockRepository.markUncompleted).toHaveBeenCalledWith(1)
      expect(mockRepository.markCompleted).not.toHaveBeenCalled()
      expect(mockLogger.info).toHaveBeenCalledWith('Todo item completion toggled', {
        id: 1,
        checked: false
      }, {
        module: 'todoItem',
        method: 'toggleTodoItemComplete'
      })
    })

    it('should return not found when todo item does not exist', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null)

      const result = await service.toggleTodoItemComplete(999)

      expect(result.success).toBe(false)
      expect(result.error).toBe('TodoItem with id 999 not found')
      expect(mockRepository.markCompleted).not.toHaveBeenCalled()
      expect(mockRepository.markUncompleted).not.toHaveBeenCalled()
    })

    it('should handle repository errors during toggle', async () => {
      const error = new Error('Toggle failed')
      vi.mocked(mockRepository.findById).mockResolvedValue(mockTodoItem)
      vi.mocked(mockRepository.markCompleted).mockRejectedValue(error)

      const result = await service.toggleTodoItemComplete(1)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Toggle failed')
    })

    it('should handle repository errors during findById', async () => {
      const error = new Error('Find failed')
      vi.mocked(mockRepository.findById).mockRejectedValue(error)

      const result = await service.toggleTodoItemComplete(1)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Find failed')
    })
  })
})