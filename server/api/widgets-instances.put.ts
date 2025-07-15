import { db, widgetInstance } from '~/lib/db';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  if (!body?.id) {
    throw createError({ statusCode: 400, statusMessage: 'id is required' });
  }
  
  const updateData: any = {};
  
  // Handle position updates - convert to database format if needed
  if (body.position) {
    let dbPosition;
    
    // Check if position is in new format {x, y, width, height}
    if ('x' in body.position && 'y' in body.position) {
      dbPosition = {
        left: `${body.position.x}px`,
        top: `${body.position.y}px`,
        width: `${body.position.width}px`,
        height: `${body.position.height}px`
      };
    } else {
      // Already in database format
      dbPosition = body.position;
    }
    
    updateData.position = JSON.stringify(dbPosition);
  }
  
  if (body.options) updateData.options = JSON.stringify(body.options);
  if (body.pageId) updateData.pageId = body.pageId;
  updateData.updatedAt = new Date().toISOString();
  
  await db.update(widgetInstance).set(updateData).where(eq(widgetInstance.id, body.id));
  const [updated] = await db.select().from(widgetInstance).where(eq(widgetInstance.id, body.id));
  
  console.log(`Widget ${body.id} updated. New position: ${updated.position}`);
  
  return updated;
}); 