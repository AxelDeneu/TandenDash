import { db, widgetInstance, pages } from '~/lib/db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    
    // Validate required fields
    if (!body.type || !body.position || !body.pageId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'type, position, and pageId are required'
      })
    }
    
    // Verify that the page exists
    const [page] = await db.select().from(pages).where(eq(pages.id, body.pageId))
    if (!page) {
      throw createError({
        statusCode: 400,
        statusMessage: `Page with id ${body.pageId} does not exist`
      })
    }
    
    // Convert position to database format (with px units)
    const dbPosition = {
      left: `${body.position.x}px`,
      top: `${body.position.y}px`,
      width: `${body.position.width}px`,
      height: `${body.position.height}px`
    }
    
    // Create the widget
    const [created] = await db.insert(widgetInstance).values({
      type: body.type,
      position: JSON.stringify(dbPosition),
      options: JSON.stringify(body.options || {}),
      pageId: body.pageId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).returning()
    
    return created
  } catch (error) {
    console.error('Error creating widget:', error)
    throw error
  }
}) 