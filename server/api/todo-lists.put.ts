import { db, todoList } from '~/lib/db';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  if (!body?.id || !body?.name) throw createError({ statusCode: 400, statusMessage: 'ID and name required' });
  await db.update(todoList)
    .set({ name: body.name, updatedAt: new Date().toISOString() })
    .where(eq(todoList.id, body.id));
  const [list] = await db.select().from(todoList).where(eq(todoList.id, body.id));
  return { ...list };
}); 