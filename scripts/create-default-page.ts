import { db, pages } from '../lib/db'

async function createDefaultPage() {
  console.log('Creating default page...')

  try {
    // Check if any pages exist
    const existingPages = await db.select().from(pages)
    
    if (existingPages.length === 0) {
      console.log('No pages found, creating default page...')
      
      const [newPage] = await db.insert(pages).values({
        name: 'Page Principale',
        dashboardId: 1,
        snapping: true,
        gridRows: 12,
        gridCols: 12,
        marginTop: 20,
        marginRight: 20,
        marginBottom: 20,
        marginLeft: 20
      }).returning()
      
      console.log('Created default page:', newPage)
    } else {
      console.log(`Found ${existingPages.length} existing pages`)
      existingPages.forEach(page => {
        console.log(`- Page "${page.name}" (id: ${page.id}) -> Dashboard: ${page.dashboardId}`)
      })
    }

  } catch (error) {
    console.error('Error creating default page:', error)
  } finally {
    process.exit(0)
  }
}

createDefaultPage()