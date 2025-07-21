import { db, dashboards, dashboardSettings, pages } from '../lib/db'
import { eq, isNull } from 'drizzle-orm'

async function migrateToMultiDashboards() {
  console.log('Starting migration to multi-dashboard system...')

  try {
    // Check if we already have dashboards
    const existingDashboards = await db.select().from(dashboards)
    
    if (existingDashboards.length > 0) {
      console.log('Dashboards already exist, skipping migration')
      return
    }

    // Create default dashboard
    console.log('Creating default dashboard...')
    const [defaultDashboard] = await db.insert(dashboards).values({
      name: 'Principal',
      isDefault: true
    }).returning()

    console.log(`Created dashboard: ${defaultDashboard.name} (ID: ${defaultDashboard.id})`)

    // Create default settings for the dashboard
    console.log('Creating default dashboard settings...')
    await db.insert(dashboardSettings).values({
      dashboardId: defaultDashboard.id,
      locale: 'fr',
      measurementSystem: 'metric',
      temperatureUnit: 'celsius',
      timeFormat: '24h',
      dateFormat: 'DD/MM/YYYY',
      timezone: 'Europe/Paris',
      theme: 'auto'
    })

    // Update all pages without dashboardId to belong to the default dashboard
    console.log('Migrating existing pages...')
    const orphanPages = await db.select().from(pages).where(isNull(pages.dashboardId))
    
    if (orphanPages.length > 0) {
      await db.update(pages)
        .set({ dashboardId: defaultDashboard.id })
        .where(isNull(pages.dashboardId))
      
      console.log(`Migrated ${orphanPages.length} pages to default dashboard`)
    } else {
      console.log('No orphan pages to migrate')
    }

    console.log('Migration completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

// Run migration
migrateToMultiDashboards()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unexpected error:', error)
    process.exit(1)
  })