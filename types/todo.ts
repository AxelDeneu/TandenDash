// Todo item from database
export interface TodoItem {
  id: number
  content: string
  checked: boolean
  todoListId: number
  position: number
  category: string | null
  createdAt: string
  updatedAt: string
}

// Todo list from database
export interface TodoList {
  id: number
  name: string
  createdAt: string
  updatedAt: string
}

// Todo list with items (for frontend composition)
export interface TodoListWithItems extends TodoList {
  items: TodoItem[]
}

// API request/response types
export interface CreateTodoListRequest {
  name: string
}

export interface UpdateTodoListRequest {
  id: number
  name?: string
}

export interface DeleteTodoListRequest {
  id: number
}

export interface CreateTodoItemRequest {
  content: string
  todoListId: number
  position?: number
  category?: string
}

export interface UpdateTodoItemRequest {
  id: number
  content?: string
  checked?: boolean
  position?: number
  category?: string
}

export interface DeleteTodoItemRequest {
  id: number
}

export interface BatchUpdateTodoItemsRequest {
  items: Array<{
    id: number
    position?: number
    checked?: boolean
  }>
}

// Todo list widget specific types
export interface TodoListReference {
  name: string
  id?: number
}