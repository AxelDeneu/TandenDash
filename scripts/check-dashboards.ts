import { db, dashboards, dashboardSettings } from '../lib/db'

async function checkDashboards() {
  console.log('Checking dashboards in database...')

  try {
    // Check all dashboards
    const allDashboards = await db.select().from(dashboards)
    console.log('Dashboards found:', allDashboards.length)
    console.log('Dashboards:', allDashboards)

    // Check dashboard settings
    const allSettings = await db.select().from(dashboardSettings)
    console.log('\nDashboard settings found:', allSettings.length)
    console.log('Settings:', allSettings)

    // If no dashboards, create one
    if (allDashboards.length === 0) {
      console.log('\nNo dashboards found, creating default dashboard...')
      
      const [newDashboard] = await db.insert(dashboards).values({
        name: 'Principal',
        isDefault: true
      }).returning()

      console.log('Created dashboard:', newDashboard)

      // Create settings
      await db.insert(dashboardSettings).values({
        dashboardId: newDashboard.id,
        locale: 'fr',
        measurementSystem: 'metric',
        temperatureUnit: 'celsius',
        timeFormat: '24h',
        dateFormat: 'DD/MM/YYYY',
        timezone: 'Europe/Paris',
        theme: 'auto'
      })

      console.log('Created dashboard settings')
    }

  } catch (error) {
    console.error('Error checking dashboards:', error)
  } finally {
    process.exit(0)
  }
}

checkDashboards()