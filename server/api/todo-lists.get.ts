import { db, todoList, todoItem } from '~/lib/db';
import { eq, asc } from 'drizzle-orm';

export default defineEventHandler(async () => {
  // Single query with LEFT JOIN to get all lists and their items
  const result = await db
    .select({
      listId: todoList.id,
      listName: todoList.name,
      listCreatedAt: todoList.createdAt,
      listUpdatedAt: todoList.updatedAt,
      itemId: todoItem.id,
      itemText: todoItem.content,
      itemChecked: todoItem.checked,
      itemPosition: todoItem.position,
      itemCategory: todoItem.category,
      itemCreatedAt: todoItem.createdAt,
      itemUpdatedAt: todoItem.updatedAt,
      itemTodoListId: todoItem.todoListId
    })
    .from(todoList)
    .leftJoin(todoItem, eq(todoList.id, todoItem.todoListId))
    .orderBy(asc(todoList.createdAt), asc(todoItem.position), asc(todoItem.id));

  // Group results by list
  const listsMap = new Map();
  
  for (const row of result) {
    if (!listsMap.has(row.listId)) {
      listsMap.set(row.listId, {
        id: row.listId,
        name: row.listName,
        createdAt: row.listCreatedAt,
        updatedAt: row.listUpdatedAt,
        items: []
      });
    }
    
    // Add item if it exists (LEFT JOIN can return null items for lists with no items)
    if (row.itemId !== null) {
      listsMap.get(row.listId).items.push({
        id: row.itemId,
        content: row.itemText,
        checked: !!row.itemChecked,
        position: row.itemPosition,
        category: row.itemCategory || undefined,
        createdAt: row.itemCreatedAt,
        updatedAt: row.itemUpdatedAt,
        todoListId: row.itemTodoListId
      });
    }
  }

  return Array.from(listsMap.values());
}); 