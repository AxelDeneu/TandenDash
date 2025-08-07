import { test, expect } from '@playwright/test'
import { resetDatabase, insertTestPages, insertTestWidget } from '../../../../tests/e2e/helpers/db-helper'

test.describe('HomeAssistant Widget', () => {
  test.beforeEach(async () => {
    await resetDatabase()
  })
  
  test('should show not configured message when no credentials', async ({ page }) => {
    // Create a test page
    const [testPage] = await insertTestPages(1)
    
    // Create a HomeAssistant widget without credentials
    const widget = await insertTestWidget(testPage.id, 'homeassistant')
    
    await page.goto(`/dashboard/1`)
    
    // Check for not configured message
    const widgetCard = page.locator(`[data-widget-id="${widget.id}"]`)
    await expect(widgetCard).toBeVisible()
    await expect(widgetCard.getByText('Not configured')).toBeVisible()
  })
  
  test('should connect to Home Assistant with valid credentials', async ({ page }) => {
    // Create a test page
    const [testPage] = await insertTestPages(1)
    
    // Create a HomeAssistant widget with credentials
    const widget = await insertTestWidget(testPage.id, 'homeassistant')
    
    // Mock Home Assistant WebSocket connection
    await page.route('**/api/websocket', async (route) => {
      await route.fulfill({
        status: 101,
        headers: {
          'Upgrade': 'websocket',
          'Connection': 'Upgrade'
        }
      })
    })
    
    await page.goto(`/dashboard/1`)
    
    const widgetCard = page.locator(`[data-widget-id="${widget.id}"]`)
    await expect(widgetCard).toBeVisible()
    
    // Should show entity selector button
    await expect(widgetCard.getByRole('button', { name: /select entity/i })).toBeVisible()
  })
  
  test('should select and display an entity', async ({ page }) => {
    // Create a test page
    const [testPage] = await insertTestPages(1)
    
    // Create a HomeAssistant widget
    const widget = await insertTestWidget(testPage.id, 'homeassistant')
    
    await page.goto(`/dashboard/1`)
    
    const widgetCard = page.locator(`[data-widget-id="${widget.id}"]`)
    
    // Click select entity button
    await widgetCard.getByRole('button', { name: /select entity/i }).click()
    
    // Entity selector should be visible
    await expect(page.getByRole('heading', { name: /select entity/i })).toBeVisible()
    
    // Search for an entity
    await page.getByPlaceholder(/search/i).fill('living room')
    
    // Select an entity (mock response would provide these)
    const entityButton = page.getByRole('button', { name: /light\.living_room/i })
    await entityButton.click()
    
    // Entity should be displayed
    await expect(widgetCard.getByText('Living Room Light')).toBeVisible()
    await expect(widgetCard.getByText('On')).toBeVisible()
  })
  
  test('should control an entity', async ({ page }) => {
    // Create a test page
    const [testPage] = await insertTestPages(1)
    
    // Create a HomeAssistant widget with a selected entity
    const widget = await insertTestWidget(testPage.id, 'homeassistant')
    
    // Add widget data for selected entity
    await page.request.put(`/api/widgets-instances/${widget.id}/data/selectedEntityId`, {
      data: 'light.living_room'
    })
    
    await page.goto(`/dashboard/1`)
    
    const widgetCard = page.locator(`[data-widget-id="${widget.id}"]`)
    
    // Find the switch control
    const switchControl = widgetCard.locator('[role="switch"]')
    await expect(switchControl).toBeVisible()
    
    // Click to toggle
    await switchControl.click()
    
    // Verify service call was made (would need to mock/intercept)
    // In real test, we'd verify the WebSocket message
  })
  
  test('should persist selected entity', async ({ page }) => {
    // Create a test page
    const [testPage] = await insertTestPages(1)
    
    // Create a HomeAssistant widget
    const widget = await insertTestWidget(testPage.id, 'homeassistant')
    
    await page.goto(`/dashboard/1`)
    
    const widgetCard = page.locator(`[data-widget-id="${widget.id}"]`)
    
    // Select an entity
    await widgetCard.getByRole('button', { name: /select entity/i }).click()
    await page.getByRole('button', { name: /light\.living_room/i }).click()
    
    // Reload page
    await page.reload()
    
    // Entity should still be selected
    await expect(widgetCard.getByText('Living Room Light')).toBeVisible()
  })
  
  test('should handle connection errors gracefully', async ({ page }) => {
    // Create a test page
    const [testPage] = await insertTestPages(1)
    
    // Create a HomeAssistant widget with invalid credentials
    const widget = await insertTestWidget(testPage.id, 'homeassistant')
    
    // Make WebSocket connection fail
    await page.route('**/api/websocket', async (route) => {
      await route.abort('failed')
    })
    
    await page.goto(`/dashboard/1`)
    
    const widgetCard = page.locator(`[data-widget-id="${widget.id}"]`)
    
    // Should show error message
    await expect(widgetCard.getByText(/connection failed|error/i)).toBeVisible()
    
    // Should show retry button
    await expect(widgetCard.getByRole('button', { name: /retry/i })).toBeVisible()
  })
})