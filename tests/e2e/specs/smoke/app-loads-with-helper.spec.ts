import { test, expect } from '@playwright/test'
import { setupConsoleErrorCapture, ignoreKnownErrors } from '../../helpers/console-helper'

test.describe('Application Loading with Console Helper', () => {
  test('should load without critical console errors', async ({ page }) => {
    const consoleCapture = setupConsoleErrorCapture(page)
    
    // Naviguer vers la page d'accueil
    await page.goto('/')
    
    // Attendre que la page soit complètement chargée
    await page.waitForLoadState('networkidle')
    
    // Récupérer et filtrer les erreurs
    const allErrors = consoleCapture.getErrors()
    const criticalErrors = ignoreKnownErrors(allErrors)
    
    // Si des erreurs critiques sont trouvées, les afficher pour le débogage
    if (criticalErrors.length > 0) {
      console.log('❌ Critical console errors found:')
      criticalErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.text}`)
        if (error.location) {
          console.log(`     Location: ${error.location}`)
        }
      })
    }
    
    // Vérifier qu'il n'y a pas d'erreurs critiques
    expect(criticalErrors).toHaveLength(0)
  })

  test('should initialize widget system without errors', async ({ page }) => {
    const consoleCapture = setupConsoleErrorCapture(page)
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Attendre un peu pour que le système de widgets s'initialise
    await page.waitForTimeout(1000)
    
    const errors = consoleCapture.getErrors()
    const widgetErrors = errors.filter(error => 
      error.text.toLowerCase().includes('widget') ||
      error.text.toLowerCase().includes('plugin')
    )
    
    expect(widgetErrors).toHaveLength(0)
  })
})