import { db, todoItem } from '~/lib/db';
import { eq, desc } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const params = event.context.params;
  if (!params?.['listId']) throw createError({ statusCode: 400, statusMessage: 'List ID required' });
  const listId = Number(params['listId']);
  const body = await readBody(event);
//   if (!body?.content) throw createError({ statusCode: 400, statusMessage: 'Content required' });
  // Get the next position for this list
  const [maxPosRow] = await db.select({ maxPos: todoItem.position }).from(todoItem).where(eq(todoItem.todoListId, listId)).orderBy(desc(todoItem.position)).limit(1);
  const maxPos = (typeof maxPosRow?.maxPos === 'number') ? maxPosRow.maxPos : -1;
  const nextPos = maxPos + 1;
  const [inserted] = await db.insert(todoItem).values({
    content: body.content,
    todoListId: listId,
    position: nextPos,
    category: body.category || null,
  }).returning();
  
  if (!inserted) throw createError({ statusCode: 500, statusMessage: 'Failed to create item' });
  return { ...inserted, checked: !!inserted.checked };
}); 