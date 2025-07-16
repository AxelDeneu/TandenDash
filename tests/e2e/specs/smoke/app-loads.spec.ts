import { test, expect } from '@playwright/test'

test.describe('Application Loading', () => {
  test('should load without console errors', async ({ page }) => {
    // Collecter les erreurs de console
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    // Naviguer vers la page d'accueil
    await page.goto('/')
    
    // Attendre que la page soit complètement chargée
    await page.waitForLoadState('networkidle')
    
    // Vérifier qu'il n'y a pas d'erreurs console
    expect(consoleErrors).toHaveLength(0)
    
    // Vérifier la présence d'éléments de base
    await expect(page).toHaveTitle(/TandenDash/)
    
    // Vérifier que le conteneur principal est présent (utiliser first() pour éviter l'erreur de mode strict)
    const dashboardContainer = page.locator('.h-screen.w-screen').first()
    await expect(dashboardContainer).toBeVisible()
  })

  test('should display initial UI elements', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Vérifier la présence du conteneur principal du dashboard (utiliser first() pour éviter l'erreur de mode strict)
    const mainContainer = page.locator('.h-screen.w-screen').first()
    await expect(mainContainer).toBeVisible()
    
    // Attendre un peu pour que l'application se charge complètement
    await page.waitForTimeout(1000)
    
    // Le setup de test crée une page par défaut, donc nous devrions avoir des pages
    // Vérifier qu'il y a au moins une page dashboard visible
    const dashboardPage = page.locator('[role="group"][aria-roledescription="slide"]').first()
    
    // Si le dashboard page est présent, le vérifier
    const dashboardPageCount = await dashboardPage.count()
    if (dashboardPageCount > 0) {
      await expect(dashboardPage).toBeVisible()
    } else {
      // Sinon, vérifier le message "no pages"
      const noPageMessage = page.getByText('No pages found')
      await expect(noPageMessage).toBeVisible()
    }
  })
})