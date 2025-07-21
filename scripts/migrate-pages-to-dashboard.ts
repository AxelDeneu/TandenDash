import { db, pages } from '../lib/db'
import { isNull } from 'drizzle-orm'

async function migratePagesToDefaultDashboard() {
  console.log('Migrating existing pages to default dashboard...')

  try {
    // Check if we have pages without dashboardId
    const orphanPages = await db
      .select()
      .from(pages)
      .where(isNull(pages.dashboardId))
    
    console.log(`Found ${orphanPages.length} pages without dashboard`)

    if (orphanPages.length > 0) {
      // Update all pages that have null dashboardId to use dashboardId = 1
      const result = await db
        .update(pages)
        .set({ dashboardId: 1 })
        .where(isNull(pages.dashboardId))
        .returning()

      console.log(`Updated ${result.length} pages to dashboard 1`)
    }
    
    // Show all pages after migration
    const allPages = await db.select().from(pages)
    console.log('\nAll pages after migration:')
    allPages.forEach(page => {
      console.log(`- Page "${page.name}" (id: ${page.id}) -> Dashboard: ${page.dashboardId}`)
    })

  } catch (error) {
    console.error('Error migrating pages:', error)
  } finally {
    process.exit(0)
  }
}

migratePagesToDefaultDashboard()