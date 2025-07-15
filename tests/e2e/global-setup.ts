import { chromium, FullConfig } from '@playwright/test'
import { copyFileSync, existsSync } from 'fs'
import { join } from 'path'

async function globalSetup(config: FullConfig) {
  // Create a test database copy to avoid modifying production data
  const originalDb = join(process.cwd(), 'data.db')
  const testDb = join(process.cwd(), 'data.test.db')
  
  if (existsSync(originalDb)) {
    copyFileSync(originalDb, testDb)
    process.env.DATABASE_URL = `file:${testDb}`
  }

  // Pre-warm the browser context
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    await page.goto(config.projects[0].use.baseURL!)
    await page.waitForLoadState('networkidle')
  } catch (error) {
    console.warn('Failed to pre-warm browser:', error)
  } finally {
    await browser.close()
  }

  return async () => {
    // Cleanup can be performed here
  }
}

export default globalSetup