import { container } from '../lib/di/container'
import { db, pages } from '../lib/db'

async function testDashboardPages() {
  console.log('Testing Dashboard Pages...')

  try {
    // First check directly in database
    console.log('\n1. Direct database check:')
    const allPages = await db.select().from(pages)
    console.log('All pages:', allPages)

    // Test repository
    console.log('\n2. Testing repository:')
    const pageRepo = container.getRepositoryFactory().createPageRepository()
    const dashboardPages = await pageRepo.findByDashboardId(1)
    console.log('Pages for dashboard 1:', dashboardPages)

    // Test service
    console.log('\n3. Testing service:')
    const pageService = container.getServiceFactory().createPageService()
    const serviceResult = await pageService.getPagesByDashboardId(1)
    console.log('Service result:', serviceResult)

  } catch (error) {
    console.error('Error testing dashboard pages:', error)
  } finally {
    process.exit(0)
  }
}

testDashboardPages()