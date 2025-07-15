import { db, todoList } from '~/lib/db';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  if (!body?.id) throw createError({ statusCode: 400, statusMessage: 'ID required' });
  await db.delete(todoList).where(eq(todoList.id, body.id));
  return { success: true };
}); 