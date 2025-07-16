import { test, expect } from '@playwright/test'
import { insertTestPages, getPageWidgets, insertTestWidget } from '../../helpers/db-helper'

test.describe('Database Test Integration', () => {
  test('should load application with test data from database', async ({ page }) => {
    // Insert test pages before navigating
    const testPages = await insertTestPages(2)
    expect(testPages).toHaveLength(2)
    
    // Navigate to the application
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Wait for the application to fully load
    await page.waitForTimeout(2000)
    
    // Verify we can see a dashboard page (the carousel might not have a specific class)
    const dashboardPage = page.locator('[role="group"][aria-roledescription="slide"]').first()
    await expect(dashboardPage).toBeVisible()
    
    // Verify that we have the main container
    const mainContainer = page.locator('.h-screen.w-screen').first()
    await expect(mainContainer).toBeVisible()
  })

  test('should display widgets from test database', async ({ page }) => {
    // Insert a test page and widget
    const [testPage] = await insertTestPages(1)
    await insertTestWidget(testPage.id, 'clock')
    
    // Navigate to the application
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Wait a bit for widgets to load
    await page.waitForTimeout(1000)
    
    // Check if widget container exists
    const widgetContainer = page.locator('[data-widget-type="clock"]')
    const widgetCount = await widgetContainer.count()
    
    // The widget should be rendered
    expect(widgetCount).toBeGreaterThan(0)
  })
})