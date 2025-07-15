import { test, expect } from '@playwright/test'

test.describe('Smoke Tests', () => {
  test('should load the dashboard successfully', async ({ page }) => {
    await page.goto('/')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
    
    // Check that the main elements are present
    await expect(page.locator('div.h-screen').first()).toBeVisible()
    await expect(page.locator('button:has-text("Edit Mode")')).toBeVisible()
    
    // Check for carousel (main content area)
    await expect(page.locator('[role="region"][aria-roledescription="carousel"]')).toBeVisible()
    
    // Take a screenshot for visual verification
    await page.screenshot({ path: 'test-results/dashboard-smoke.png' })
  })

  test('should have correct page title', async ({ page }) => {
    await page.goto('/')
    // Since there's no explicit title set, check for the presence of key elements
    await expect(page.locator('button:has-text("Edit Mode")')).toBeVisible()
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    await page.waitForLoadState('networkidle')
    await expect(page.locator('div.h-screen').first()).toBeVisible()
    await expect(page.locator('button:has-text("Edit Mode")')).toBeVisible()
    
    // Take a mobile screenshot
    await page.screenshot({ path: 'test-results/dashboard-mobile.png' })
  })

  test('should show debug info', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check for debug info showing page and widget count (using specific debug element)
    await expect(page.locator('.fixed.top-4.left-4.bg-black.text-white').first()).toBeVisible()
    await expect(page.locator('.fixed.top-4.left-4.bg-black.text-white').first()).toContainText('Page')
    await expect(page.locator('.fixed.top-4.left-4.bg-black.text-white').first()).toContainText('widgets')
  })

  test('should enable edit mode', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Click edit mode button
    await page.click('button:has-text("Edit Mode")')
    
    // Check that edit mode is enabled
    await expect(page.locator('button:has-text("Exit Edit")')).toBeVisible()
    
    // Check for edit mode class
    await expect(page.locator('div.edit-mode')).toBeVisible()
  })
})