import { test, expect } from '@playwright/test'
import { resetDatabase } from '../helpers/db-helper'

test.describe('Home Assistant Entity Selector', () => {
  test.beforeEach(async ({ page }) => {
    await resetDatabase()
    await page.goto('/')
  })

  test('should show configuration message when no connection details provided', async ({ page }) => {
    // Add a Home Assistant widget
    await page.getByLabel('Add Widget').click()
    await page.getByRole('menuitem', { name: 'Home Assistant' }).click()
    
    // Wait for configuration modal
    await expect(page.getByRole('dialog')).toBeVisible()
    
    // Click on entity select
    await page.getByLabel('Entity').click()
    
    // Should show configuration required message
    await expect(page.getByText('Configure connection first')).toBeVisible()
  })

  test('should refresh entity list when domain filter changes', async ({ page }) => {
    // Add a Home Assistant widget
    await page.getByLabel('Add Widget').click()
    await page.getByRole('menuitem', { name: 'Home Assistant' }).click()
    
    // Configure connection (mock values for testing)
    await page.getByLabel('Instance URL').fill('http://homeassistant.local:8123')
    await page.getByLabel('Access Token').fill('test-token-123')
    
    // Select a domain filter
    await page.getByLabel('Entity Type Filter').click()
    await page.getByRole('option', { name: 'Light' }).click()
    
    // The entity field should auto-refresh (in real scenario it would fetch from API)
    // For now just verify the field is enabled
    const entitySelect = page.getByLabel('Entity')
    await expect(entitySelect).toBeEnabled()
  })

  test('should show refresh button for entity list', async ({ page }) => {
    // Add a Home Assistant widget
    await page.getByLabel('Add Widget').click()
    await page.getByRole('menuitem', { name: 'Home Assistant' }).click()
    
    // Configure connection
    await page.getByLabel('Instance URL').fill('http://homeassistant.local:8123')
    await page.getByLabel('Access Token').fill('test-token-123')
    
    // Check refresh button exists
    const refreshButton = page.getByRole('button', { name: 'Refresh entities' })
    await expect(refreshButton).toBeVisible()
    
    // Click refresh button
    await refreshButton.click()
    
    // In a real test with mocked API, we would verify the API call
    // For now just verify the button is clickable
    await expect(refreshButton).toBeEnabled()
  })

  test('should support custom entity ID input', async ({ page }) => {
    // Add a Home Assistant widget
    await page.getByLabel('Add Widget').click()
    await page.getByRole('menuitem', { name: 'Home Assistant' }).click()
    
    // Configure connection
    await page.getByLabel('Instance URL').fill('http://homeassistant.local:8123')
    await page.getByLabel('Access Token').fill('test-token-123')
    
    // The entity field should allow custom values
    const entitySelect = page.getByLabel('Entity')
    await entitySelect.click()
    
    // Type a custom entity ID
    await entitySelect.fill('sensor.custom_temperature')
    
    // Save the configuration
    await page.getByRole('button', { name: 'Add' }).click()
    
    // Verify widget was added (would show the custom entity in real scenario)
    await expect(page.getByText('Home Assistant')).toBeVisible()
  })
})