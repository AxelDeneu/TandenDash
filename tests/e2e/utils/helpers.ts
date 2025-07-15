import { Page, Locator, expect } from '@playwright/test'
import { selectors } from './selectors'

export class TestHelpers {
  constructor(private page: Page) {}

  // Navigation helpers
  async navigateToNextPage() {
    await this.page.click(selectors.navigation.nextButton)
    await this.page.waitForLoadState('networkidle')
  }

  async navigateToPrevPage() {
    await this.page.click(selectors.navigation.prevButton)
    await this.page.waitForLoadState('networkidle')
  }

  async getCurrentPageName(): Promise<string> {
    return await this.page.textContent(selectors.navigation.currentPage) || ''
  }

  // Edit mode helpers
  async enableEditMode() {
    const editButton = this.page.locator(selectors.editMode.toggle)
    if (await editButton.textContent() === 'Edit Mode') {
      await editButton.click()
    }
    // Wait for edit mode to be active (check for the edit mode class)
    await expect(this.page.locator(selectors.editMode.indicator)).toBeVisible()
  }

  async disableEditMode() {
    const editButton = this.page.locator(selectors.editMode.toggle)
    if (await editButton.textContent() === 'Exit Edit') {
      await editButton.click()
    }
    // Wait for edit mode to be disabled (check that edit mode class is gone)
    await expect(this.page.locator(selectors.editMode.indicator)).not.toBeVisible()
  }

  async isEditModeEnabled(): Promise<boolean> {
    const editButton = this.page.locator(selectors.editMode.toggle)
    const buttonText = await editButton.textContent()
    return buttonText === 'Exit Edit'
  }

  // Widget management helpers
  async addWidget(widgetType: string, config?: Record<string, any>) {
    await this.enableEditMode()
    
    // Right-click on the page content area within the context menu trigger
    const pageContent = this.page.locator('[data-testid="page-context-trigger"] div.w-full.h-full').first()
    await pageContent.click({ button: 'right', position: { x: 400, y: 400 } })
    
    // Wait for context menu to appear and navigate it
    await this.page.waitForTimeout(500)
    await this.page.locator(selectors.contextMenu.widgetsMenuTrigger).hover()
    await this.page.waitForTimeout(300) // Wait for submenu to appear
    await this.page.locator(selectors.contextMenu.addWidget).click()
    
    // Wait for dialog to open
    await expect(this.page.locator(selectors.addWidget.dialog)).toBeVisible()
    
    // Select widget type
    await this.page.locator(selectors.addWidget.typeSelect).click()
    await this.page.locator(selectors.addWidget.widgetOption(widgetType)).click()
    
    if (config) {
      await this.fillWidgetConfig(config)
    }
    
    await this.page.locator(selectors.addWidget.submitButton).click()
    await expect(this.page.locator(selectors.addWidget.dialog)).not.toBeVisible()
  }

  private async fillWidgetConfig(config: Record<string, any>) {
    for (const [key, value] of Object.entries(config)) {
      const input = this.page.locator(selectors.forms.input(key))
      
      if (await input.count() > 0) {
        const inputType = await input.getAttribute('type')
        
        switch (inputType) {
          case 'checkbox':
            if (value && !(await input.isChecked())) {
              await input.click()
            } else if (!value && (await input.isChecked())) {
              await input.click()
            }
            break
          case 'color':
            await input.fill(value)
            break
          case 'range':
            await input.fill(value.toString())
            break
          default:
            await input.fill(value.toString())
        }
      }
      
      const select = this.page.locator(selectors.forms.select(key))
      if (await select.count() > 0) {
        await select.selectOption(value)
      }
    }
  }

  async deleteWidget(widgetIndex: number = 0) {
    await this.enableEditMode()
    
    // Get widgets from the current visible page
    const widgets = this.page.locator('[data-radix-collection-item] [data-testid="widget-card"]')
    const widget = widgets.nth(widgetIndex)
    
    // Wait for the widget to be visible and in edit mode
    await expect(widget).toBeVisible()
    
    // Widget controls only show in edit mode, so we should see them
    const deleteButton = widget.locator(selectors.widgetCard.deleteButton)
    await expect(deleteButton).toBeVisible()
    await deleteButton.click()
    
    // Confirm deletion if there's a confirmation dialog
    const confirmButton = this.page.locator('button:has-text("Delete"), button:has-text("Confirm"), button:has-text("Yes")')
    if (await confirmButton.count() > 0) {
      await confirmButton.first().click()
    }
  }

  async getWidgetCount(): Promise<number> {
    // Get widgets from the current visible page only
    return await this.page.locator('[data-radix-collection-item] [data-testid="widget-card"]').count()
  }

  // Drag and drop helpers
  async dragWidget(widgetIndex: number, targetPosition: { x: number; y: number }) {
    await this.enableEditMode()
    const widget = this.page.locator(selectors.widgetCard.container).nth(widgetIndex)
    const dragHandle = widget.locator(selectors.widgetCard.dragHandle)
    
    const gridOverlay = this.page.locator(selectors.editMode.gridOverlay)
    const gridBounds = await gridOverlay.boundingBox()
    
    if (!gridBounds) throw new Error('Grid overlay not found')
    
    const cellWidth = gridBounds.width / 4 // Assuming 4x4 grid
    const cellHeight = gridBounds.height / 4
    
    const targetX = gridBounds.x + (targetPosition.x * cellWidth) + (cellWidth / 2)
    const targetY = gridBounds.y + (targetPosition.y * cellHeight) + (cellHeight / 2)
    
    await dragHandle.dragTo(this.page.locator('body'), {
      targetPosition: { x: targetX, y: targetY }
    })
  }

  async resizeWidget(widgetIndex: number, deltaX: number, deltaY: number) {
    await this.enableEditMode()
    const widget = this.page.locator(selectors.widgetCard.container).nth(widgetIndex)
    const resizeHandle = widget.locator(selectors.widgetCard.resizeHandle)
    
    const handleBounds = await resizeHandle.boundingBox()
    if (!handleBounds) throw new Error('Resize handle not found')
    
    await this.page.mouse.move(handleBounds.x + handleBounds.width / 2, handleBounds.y + handleBounds.height / 2)
    await this.page.mouse.down()
    await this.page.mouse.move(handleBounds.x + deltaX, handleBounds.y + deltaY)
    await this.page.mouse.up()
  }

  // Dark mode helpers
  async toggleDarkMode() {
    const centerX = this.page.viewportSize()!.width / 2
    const centerY = this.page.viewportSize()!.height / 2
    
    // Triple-tap in center of screen to toggle dark mode
    for (let i = 0; i < 3; i++) {
      await this.page.click('body', { position: { x: centerX, y: centerY } })
      await this.page.waitForTimeout(100) // Small delay between taps
    }
    
    await this.page.waitForTimeout(500) // Wait for theme transition
  }

  async isDarkModeEnabled(): Promise<boolean> {
    const html = this.page.locator('html')
    const classList = await html.getAttribute('class')
    return classList?.includes('dark') || false
  }

  // Page management helpers
  async addPage(pageName: string) {
    await this.page.click(selectors.contextMenu.trigger, { button: 'right' })
    await this.page.click(selectors.contextMenu.addPage)
    
    const nameInput = this.page.locator('input[placeholder*="page name"]')
    await nameInput.fill(pageName)
    await this.page.keyboard.press('Enter')
  }

  async deletePage() {
    await this.page.click(selectors.contextMenu.trigger, { button: 'right' })
    await this.page.click(selectors.contextMenu.deletePage)
    
    const confirmButton = this.page.locator('button:has-text("Delete")')
    await confirmButton.click()
  }

  // Wait helpers
  async waitForWidgetLoad(widgetType: string, timeout: number = 10000) {
    const widgetSelector = this.getWidgetSelector(widgetType)
    await this.page.waitForSelector(widgetSelector, { timeout })
  }

  private getWidgetSelector(widgetType: string): string {
    switch (widgetType.toLowerCase()) {
      case 'clock':
        return selectors.clockWidget.container
      case 'weather':
        return selectors.weatherWidget.container
      case 'todo':
        return selectors.todoWidget.container
      default:
        return selectors.widgetCard.container
    }
  }

  // Assertion helpers
  async expectWidgetVisible(widgetType: string) {
    const selector = this.getWidgetSelector(widgetType)
    await expect(this.page.locator(selector)).toBeVisible()
  }

  async expectWidgetCount(expectedCount: number) {
    const widgets = this.page.locator(selectors.widgetCard.container)
    await expect(widgets).toHaveCount(expectedCount)
  }

  async expectPageName(expectedName: string) {
    await expect(this.page.locator(selectors.navigation.currentPage)).toHaveText(expectedName)
  }

  // Screenshot helpers
  async takeScreenshot(name: string) {
    await this.page.screenshot({ 
      path: `test-results/screenshots/${name}.png`,
      fullPage: true 
    })
  }

  // Database helpers (for test cleanup)
  async clearDatabase() {
    // This would connect to the test database and clear widget/page data
    // Implementation depends on your database setup
    await this.page.evaluate(() => {
      // Clear localStorage/sessionStorage if used
      localStorage.clear()
      sessionStorage.clear()
    })
  }
}