import { db, todoList } from '~/lib/db';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  if (!body?.name) throw createError({ statusCode: 400, statusMessage: 'Name required' });
  const [inserted] = await db.insert(todoList).values({ name: body.name }).returning();
  return { ...inserted, items: [] };
}); 