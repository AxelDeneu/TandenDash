import { Page, Locator } from '@playwright/test'
import { TestHelpers } from '../utils/helpers'
import { selectors } from '../utils/selectors'

export class DashboardPage {
  private helpers: TestHelpers

  // Navigation elements
  readonly prevButton: Locator
  readonly nextButton: Locator
  readonly currentPageName: Locator
  readonly pageIndicator: Locator

  // Edit mode elements
  readonly editToggle: Locator
  readonly gridOverlay: Locator
  readonly addWidgetButton: Locator

  // Widget elements
  readonly widgets: Locator
  readonly widgetCards: Locator

  constructor(private page: Page) {
    this.helpers = new TestHelpers(page)
    
    // Initialize locators
    this.prevButton = page.locator(selectors.navigation.prevButton)
    this.nextButton = page.locator(selectors.navigation.nextButton)
    this.currentPageName = page.locator(selectors.navigation.currentPage)
    this.pageIndicator = page.locator(selectors.navigation.pageIndicator)
    
    this.editToggle = page.locator(selectors.editMode.toggle)
    this.gridOverlay = page.locator(selectors.editMode.gridOverlay)
    this.addWidgetButton = page.locator(selectors.addWidget.button)
    
    this.widgets = page.locator(selectors.widgetCard.container)
    this.widgetCards = page.locator(selectors.widgetCard.container)
  }

  // Navigation methods
  async goto() {
    await this.page.goto('/')
    await this.page.waitForLoadState('networkidle')
  }

  async navigateToNextPage() {
    await this.helpers.navigateToNextPage()
  }

  async navigateToPrevPage() {
    await this.helpers.navigateToPrevPage()
  }

  async getCurrentPageName(): Promise<string> {
    return await this.helpers.getCurrentPageName()
  }

  // Edit mode methods
  async enableEditMode() {
    await this.helpers.enableEditMode()
  }

  async disableEditMode() {
    await this.helpers.disableEditMode()
  }

  async isEditModeEnabled(): Promise<boolean> {
    return await this.helpers.isEditModeEnabled()
  }

  // Widget management methods
  async addWidget(widgetType: string, config?: Record<string, any>) {
    await this.helpers.addWidget(widgetType, config)
  }

  async deleteWidget(widgetIndex: number = 0) {
    await this.helpers.deleteWidget(widgetIndex)
  }

  async getWidgetCount(): Promise<number> {
    return await this.helpers.getWidgetCount()
  }

  async dragWidget(widgetIndex: number, targetPosition: { x: number; y: number }) {
    await this.helpers.dragWidget(widgetIndex, targetPosition)
  }

  async resizeWidget(widgetIndex: number, deltaX: number, deltaY: number) {
    await this.helpers.resizeWidget(widgetIndex, deltaX, deltaY)
  }

  // Dark mode methods
  async toggleDarkMode() {
    await this.helpers.toggleDarkMode()
  }

  async isDarkModeEnabled(): Promise<boolean> {
    return await this.helpers.isDarkModeEnabled()
  }

  // Page management methods
  async addPage(pageName: string) {
    await this.helpers.addPage(pageName)
  }

  async deletePage() {
    await this.helpers.deletePage()
  }

  async rightClickOnEmptySpace() {
    const dashboard = this.page.locator('main')
    await dashboard.click({ button: 'right', position: { x: 100, y: 100 } })
  }

  // Widget-specific methods
  async getClockWidget(index: number = 0) {
    return new ClockWidget(this.page, index)
  }

  async getWeatherWidget(index: number = 0) {
    return new WeatherWidget(this.page, index)
  }

  async getTodoWidget(index: number = 0) {
    return new TodoWidget(this.page, index)
  }

  // Utility methods
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle')
    await this.page.waitForSelector(selectors.navigation.currentPage)
  }

  async takeScreenshot(name: string) {
    await this.helpers.takeScreenshot(name)
  }
}

// Widget-specific page objects
export class ClockWidget {
  readonly container: Locator
  readonly timeDisplay: Locator
  readonly dateDisplay: Locator
  readonly separator: Locator

  constructor(private page: Page, private index: number = 0) {
    this.container = page.locator(selectors.clockWidget.container).nth(index)
    this.timeDisplay = this.container.locator(selectors.clockWidget.timeDisplay)
    this.dateDisplay = this.container.locator(selectors.clockWidget.dateDisplay)
    this.separator = this.container.locator(selectors.clockWidget.separator)
  }

  async getDisplayedTime(): Promise<string> {
    return await this.timeDisplay.textContent() || ''
  }

  async getDisplayedDate(): Promise<string> {
    return await this.dateDisplay.textContent() || ''
  }

  async isDateVisible(): Promise<boolean> {
    return await this.dateDisplay.isVisible()
  }

  async isSecondsVisible(): Promise<boolean> {
    const timeText = await this.getDisplayedTime()
    return timeText.split(':').length === 3
  }
}

export class WeatherWidget {
  readonly container: Locator
  readonly temperature: Locator
  readonly location: Locator
  readonly condition: Locator
  readonly icon: Locator

  constructor(private page: Page, private index: number = 0) {
    this.container = page.locator(selectors.weatherWidget.container).nth(index)
    this.temperature = this.container.locator(selectors.weatherWidget.temperature)
    this.location = this.container.locator(selectors.weatherWidget.location)
    this.condition = this.container.locator(selectors.weatherWidget.condition)
    this.icon = this.container.locator(selectors.weatherWidget.icon)
  }

  async getTemperature(): Promise<string> {
    return await this.temperature.textContent() || ''
  }

  async getLocation(): Promise<string> {
    return await this.location.textContent() || ''
  }

  async getCondition(): Promise<string> {
    return await this.condition.textContent() || ''
  }

  async hasWeatherIcon(): Promise<boolean> {
    return await this.icon.isVisible()
  }
}

export class TodoWidget {
  readonly container: Locator
  readonly listContainer: Locator
  readonly addItemInput: Locator
  readonly addListButton: Locator

  constructor(private page: Page, private index: number = 0) {
    this.container = page.locator(selectors.todoWidget.container).nth(index)
    this.listContainer = this.container.locator(selectors.todoWidget.listContainer)
    this.addItemInput = this.container.locator(selectors.todoWidget.addItemInput)
    this.addListButton = this.container.locator(selectors.todoWidget.addListButton)
  }

  async addTodoItem(text: string, listIndex: number = 0) {
    const lists = this.listContainer.locator(selectors.todoWidget.listTitle)
    const targetList = lists.nth(listIndex)
    
    await targetList.click()
    await this.addItemInput.fill(text)
    await this.page.keyboard.press('Enter')
  }

  async toggleTodoItem(itemIndex: number) {
    const items = this.container.locator(selectors.todoWidget.todoItem)
    const checkbox = items.nth(itemIndex).locator(selectors.todoWidget.checkbox)
    await checkbox.click()
  }

  async deleteTodoItem(itemIndex: number) {
    const items = this.container.locator(selectors.todoWidget.todoItem)
    const deleteButton = items.nth(itemIndex).locator(selectors.todoWidget.deleteItem)
    await deleteButton.click()
  }

  async getTodoItemCount(): Promise<number> {
    return await this.container.locator(selectors.todoWidget.todoItem).count()
  }

  async getTodoItemText(itemIndex: number): Promise<string> {
    const items = this.container.locator(selectors.todoWidget.todoItem)
    return await items.nth(itemIndex).textContent() || ''
  }

  async isTodoItemCompleted(itemIndex: number): Promise<boolean> {
    const items = this.container.locator(selectors.todoWidget.todoItem)
    const checkbox = items.nth(itemIndex).locator(selectors.todoWidget.checkbox)
    return await checkbox.isChecked()
  }
}