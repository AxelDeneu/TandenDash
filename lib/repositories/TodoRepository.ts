import { eq, asc } from 'drizzle-orm'
import { db, todoList, todoItem } from '@/lib/db'
import type { ITodoListRepository, ITodoItemRepository } from './interfaces'
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
import { 
  CreateTodoListRequestSchema,
  UpdateTodoListRequestSchema,
  CreateTodoItemRequestSchema,
  UpdateTodoItemRequestSchema,
  BatchUpdateTodoItemsRequestSchema
} from '@/lib/validation'

export class TodoListRepository implements ITodoListRepository {
  async findById(id: number): Promise<TodoList | null> {
    const results = await db.select().from(todoList).where(eq(todoList.id, id))
    return results[0] || null
  }

  async findAll(): Promise<TodoList[]> {
    return await db.select().from(todoList)
  }

  async findWithItems(id: number): Promise<TodoListWithItems | null> {
    const list = await this.findById(id)
    if (!list) return null

    const items = await db.select()
      .from(todoItem)
      .where(eq(todoItem.todoListId, id))
      .orderBy(asc(todoItem.position), asc(todoItem.id))

    return {
      ...list,
      items: items.map(item => ({
        ...item,
        checked: !!item.checked,
        category: item.category || null
      }))
    }
  }

  async findAllWithItems(): Promise<TodoListWithItems[]> {
    const lists = await this.findAll()
    
    const listsWithItems = await Promise.all(
      lists.map(async (list) => {
        const items = await db.select()
          .from(todoItem)
          .where(eq(todoItem.todoListId, list.id))
          .orderBy(asc(todoItem.position), asc(todoItem.id))

        return {
          ...list,
          items: items.map(item => ({
            ...item,
            checked: !!item.checked,
            category: item.category || null
          }))
        }
      })
    )

    return listsWithItems
  }

  async create(data: CreateTodoListRequest): Promise<TodoList> {
    const validatedData = CreateTodoListRequestSchema.parse(data)
    
    const [created] = await db.insert(todoList).values({
      name: validatedData.name
    }).returning()
    
    return created
  }

  async update(id: number, data: UpdateTodoListRequest): Promise<TodoList> {
    const validatedData = UpdateTodoListRequestSchema.parse({ ...data, id })
    
    const updateData: Partial<{ name: string }> = {}
    if (validatedData.name !== undefined) updateData.name = validatedData.name
    
    const [updated] = await db.update(todoList)
      .set(updateData)
      .where(eq(todoList.id, id))
      .returning()
    
    if (!updated) {
      throw new Error(`Todo list with id ${id} not found`)
    }
    
    return updated
  }

  async delete(id: number): Promise<boolean> {
    // Use transaction to delete list and associated items
    await db.transaction(async (tx) => {
      // Delete associated items first (cascade should handle this, but being explicit)
      await tx.delete(todoItem).where(eq(todoItem.todoListId, id))
      
      // Delete the list
      await tx.delete(todoList).where(eq(todoList.id, id))
    })
    
    return true
  }
}

export class TodoItemRepository implements ITodoItemRepository {
  async findById(id: number): Promise<TodoItem | null> {
    const results = await db.select().from(todoItem).where(eq(todoItem.id, id))
    const item = results[0]
    if (!item) return null
    
    return {
      ...item,
      checked: !!item.checked,
      category: item.category || null
    }
  }

  async findAll(): Promise<TodoItem[]> {
    const items = await db.select().from(todoItem).orderBy(asc(todoItem.position), asc(todoItem.id))
    return items.map(item => ({
      ...item,
      checked: !!item.checked,
      category: item.category || null
    }))
  }

  async findByListId(listId: number): Promise<TodoItem[]> {
    const items = await db.select()
      .from(todoItem)
      .where(eq(todoItem.todoListId, listId))
      .orderBy(asc(todoItem.position), asc(todoItem.id))
    
    return items.map(item => ({
      ...item,
      checked: !!item.checked,
      category: item.category || null
    }))
  }

  async create(data: CreateTodoItemRequest): Promise<TodoItem> {
    const validatedData = CreateTodoItemRequestSchema.parse(data)
    
    // If no position provided, set it to the end
    let position = validatedData.position
    if (position === undefined) {
      const existingItems = await this.findByListId(validatedData.todoListId)
      position = existingItems.length
    }
    
    const [created] = await db.insert(todoItem).values({
      content: validatedData.content,
      todoListId: validatedData.todoListId,
      position,
      category: validatedData.category || null,
      checked: false
    }).returning()
    
    return {
      ...created,
      checked: !!created.checked,
      category: created.category || null
    }
  }

  async update(id: number, data: UpdateTodoItemRequest): Promise<TodoItem> {
    const validatedData = UpdateTodoItemRequestSchema.parse({ ...data, id })
    
    const updateData: Partial<{
      content: string
      checked: boolean
      position: number
      category: string | null
    }> = {}
    
    if (validatedData.content !== undefined) updateData.content = validatedData.content
    if (validatedData.checked !== undefined) updateData.checked = validatedData.checked
    if (validatedData.position !== undefined) updateData.position = validatedData.position
    if (validatedData.category !== undefined) updateData.category = validatedData.category
    
    const [updated] = await db.update(todoItem)
      .set(updateData)
      .where(eq(todoItem.id, id))
      .returning()
    
    if (!updated) {
      throw new Error(`Todo item with id ${id} not found`)
    }
    
    return {
      ...updated,
      checked: !!updated.checked,
      category: updated.category || null
    }
  }

  async delete(id: number): Promise<boolean> {
    const result = await db.delete(todoItem).where(eq(todoItem.id, id))
    return result.changes > 0
  }

  async updatePositions(items: Array<{ id: number; position: number }>): Promise<TodoItem[]> {
    const results: TodoItem[] = []
    
    await db.transaction(async (tx) => {
      for (const item of items) {
        const [updated] = await tx.update(todoItem)
          .set({ position: item.position })
          .where(eq(todoItem.id, item.id))
          .returning()
        
        if (updated) {
          results.push({
            ...updated,
            checked: !!updated.checked,
            category: updated.category || null
          })
        }
      }
    })
    
    return results
  }

  async batchUpdate(updates: BatchUpdateTodoItemsRequest): Promise<TodoItem[]> {
    const validatedData = BatchUpdateTodoItemsRequestSchema.parse(updates)
    const results: TodoItem[] = []
    
    await db.transaction(async (tx) => {
      for (const item of validatedData.items) {
        const updateData: Partial<{
          position: number
          checked: boolean
        }> = {}
        
        if (item.position !== undefined) updateData.position = item.position
        if (item.checked !== undefined) updateData.checked = item.checked
        
        const [updated] = await tx.update(todoItem)
          .set(updateData)
          .where(eq(todoItem.id, item.id))
          .returning()
        
        if (updated) {
          results.push({
            ...updated,
            checked: !!updated.checked,
            category: updated.category || null
          })
        }
      }
    })
    
    return results
  }

  async markCompleted(id: number): Promise<TodoItem> {
    return this.update(id, { checked: true })
  }

  async markUncompleted(id: number): Promise<TodoItem> {
    return this.update(id, { checked: false })
  }
}