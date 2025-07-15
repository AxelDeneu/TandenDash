import { db, widgetInstance } from '~/lib/db';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  if (!body?.id) {
    throw createError({ statusCode: 400, statusMessage: 'id is required' });
  }
  await db.delete(widgetInstance).where(eq(widgetInstance.id, body.id));
  return { success: true };
}); 