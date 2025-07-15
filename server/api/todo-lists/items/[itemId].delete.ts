import { db, todoItem } from '~/lib/db';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const params = event.context.params;
  if (!params?.['itemId']) throw createError({ statusCode: 400, statusMessage: 'Item ID required' });
  const itemId = Number(params['itemId']);
  await db.delete(todoItem).where(eq(todoItem.id, itemId));
  return { success: true };
}); 