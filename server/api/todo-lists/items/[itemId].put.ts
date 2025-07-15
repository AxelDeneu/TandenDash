import { db, todoItem } from '~/lib/db';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const params = event.context.params;
  if (!params?.['itemId']) throw createError({ statusCode: 400, statusMessage: 'Item ID required' });
  const itemId = Number(params['itemId']);
  const body = await readBody(event);
  if (typeof body?.content !== 'string' || typeof body?.checked !== 'boolean') {
    throw createError({ statusCode: 400, statusMessage: 'Content and checked required' });
  }
  const updateData: any = {
    content: body.content,
    checked: !!body.checked,
    category: body.category || null,
    updatedAt: new Date().toISOString(),
    todoListId: body.todoListId || undefined,
  };
  if (typeof body.position === 'number') {
    updateData.position = body.position;
  }
  await db.update(todoItem).set(updateData).where(eq(todoItem.id, itemId));
  const [item] = await db.select().from(todoItem).where(eq(todoItem.id, itemId));
  
  if (!item) throw createError({ statusCode: 404, statusMessage: 'Item not found' });
  return { ...item, checked: !!item.checked };
}); 