import { db, pages } from '../lib/db'
import { isNull } from 'drizzle-orm'

async function linkPagesToDashboard() {
  console.log('Linking existing pages to default dashboard...')

  try {
    // Update all pages that have null dashboardId to use dashboardId = 1
    const result = await db
      .update(pages)
      .set({ dashboardId: 1 })
      .where(isNull(pages.dashboardId))
      .returning()

    console.log(`Updated ${result.length} pages to be linked to dashboard 1`)
    
    // Check all pages
    const allPages = await db.select().from(pages)
    console.log('\nAll pages after update:')
    allPages.forEach(page => {
      console.log(`- Page "${page.name}" (id: ${page.id}) -> Dashboard: ${page.dashboardId}`)
    })

  } catch (error) {
    console.error('Error linking pages:', error)
  } finally {
    process.exit(0)
  }
}

linkPagesToDashboard()