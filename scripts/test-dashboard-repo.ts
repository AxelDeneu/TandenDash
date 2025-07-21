import { container } from '../lib/di/container'

async function testDashboardRepository() {
  console.log('Testing Dashboard Repository...')

  try {
    const dashboardRepo = container.getRepositoryFactory().createDashboardRepository()
    
    console.log('\n1. Finding all dashboards:')
    const dashboards = await dashboardRepo.findAll()
    console.log('Found dashboards:', dashboards)

    console.log('\n2. Finding default dashboard:')
    const defaultDashboard = await dashboardRepo.findDefault()
    console.log('Default dashboard:', defaultDashboard)

    console.log('\n3. Testing service layer:')
    const dashboardService = container.getServiceFactory().createDashboardService()
    const serviceResult = await dashboardService.findDefault()
    console.log('Service result:', serviceResult)

  } catch (error) {
    console.error('Error testing dashboard repository:', error)
  } finally {
    process.exit(0)
  }
}

testDashboardRepository()