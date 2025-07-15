import { db, todoItem } from '~/lib/db';
import { eq, inArray } from 'drizzle-orm';

interface UpdateItem {
  id: number;
  content?: string;
  checked?: boolean;
  position?: number;
  todoListId?: number;
  category?: string | null;
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  if (!Array.isArray(body?.items)) {
    throw createError({ statusCode: 400, statusMessage: 'Array of items required' });
  }
  
  const items: UpdateItem[] = body.items;
  if (items.length === 0) {
    return { items: [] };
  }

  // Use transaction for batch updates
  const result = await db.transaction(async (tx) => {
    const updatePromises = items.map(item => 
      tx.update(todoItem)
        .set({
          content: item.content, // Database field name is 'content'
          checked: !!item.checked,
          position: item.position,
          todoListId: item.todoListId,
          category: item.category || null,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(todoItem.id, item.id))
    );
    
    // Execute all updates in parallel within the transaction
    await Promise.all(updatePromises);
    
    // Fetch updated items in a single query
    const ids = items.map(i => i.id);
    const updatedItems = await tx.select().from(todoItem).where(inArray(todoItem.id, ids));
    
    return updatedItems;
  });

  return { 
    items: result.map(item => ({ 
      ...item, 
      checked: !!item.checked,
      category: item.category || undefined 
    })) 
  };
});