export const selectors = {
  // Navigation  
  navigation: {
    prevButton: '[data-radix-scroll-area-viewport] button:first-child',
    nextButton: '[data-radix-scroll-area-viewport] button:last-child',
    pageIndicator: '.fixed.top-4.left-4',
    currentPage: '.fixed.top-4.left-4',
    carousel: '[data-radix-collection-item]',
  },

  // Edit Mode
  editMode: {
    toggle: 'button:has-text("Edit Mode"), button:has-text("Exit Edit")',
    indicator: 'div.edit-mode',
    gridOverlay: '[data-testid="grid-overlay"]',
  },

  // Add Widget
  addWidget: {
    button: '[data-testid="add-widget-menu"]',
    dialog: '[data-testid="widget-dialog"]',
    typeSelect: '[data-testid="widget-type-select"]',
    widgetOption: (name: string) => `[data-testid="widget-option-${name.toLowerCase()}"]`,
    submitButton: '[data-testid="widget-save-button"]',
    cancelButton: '[data-testid="widget-cancel-button"]',
  },

  // Widget Card
  widgetCard: {
    container: '[data-testid="widget-card"]',
    dragHandle: '[data-testid="drag-handle"]',
    resizeHandle: '[data-testid="resize-handle"]',
    editButton: '[data-testid="widget-edit-button"]',
    deleteButton: '[data-testid="widget-delete-button"]',
    content: '[data-testid="widget-content"]',
  },

  // Widget Types
  clockWidget: {
    container: '[data-testid="clock-widget"]',
    timeDisplay: '[data-testid="clock-time"]',
    dateDisplay: '[data-testid="clock-date"]',
    separator: '[data-testid="clock-separator"]',
  },

  weatherWidget: {
    container: '[data-testid="weather-widget"]',
    temperature: '[data-testid="weather-temperature"]',
    location: '[data-testid="weather-location"]',
    condition: '[data-testid="weather-condition"]',
    icon: '[data-testid="weather-icon"]',
  },

  todoWidget: {
    container: '[data-testid="todo-widget"]',
    listContainer: '[data-testid="todo-list"]',
    listTitle: '[data-testid="list-title"]',
    addItemInput: '[data-testid="add-todo-input"]',
    todoItem: '[data-testid="todo-item"]',
    checkbox: '[data-testid="todo-checkbox"]',
    deleteItem: '[data-testid="delete-todo"]',
    addListButton: '[data-testid="add-list"]',
  },

  // Page Context Menu
  contextMenu: {
    trigger: '[data-testid="page-context-trigger"]',
    menu: '[data-testid="page-context-menu"]',
    widgetsMenuTrigger: '[data-testid="widgets-menu-trigger"]',
    pagesMenuTrigger: '[data-testid="pages-menu-trigger"]',
    addWidget: '[data-testid="add-widget-menu"]',
    addPage: '[data-testid="add-page-menu"]',
    renamePage: '[data-testid="rename-page-menu"]',
    deletePage: '[data-testid="delete-page-menu"]',
  },

  // Forms
  forms: {
    input: (name: string) => `input[name="${name}"]`,
    select: (name: string) => `select[name="${name}"]`,
    checkbox: (name: string) => `input[type="checkbox"][name="${name}"]`,
    radio: (name: string, value: string) => `input[type="radio"][name="${name}"][value="${value}"]`,
    colorPicker: (name: string) => `input[type="color"][name="${name}"]`,
    slider: (name: string) => `input[type="range"][name="${name}"]`,
  },

  // Dark Mode
  darkMode: {
    tapArea: '[data-testid="dark-mode-tap-area"]',
    indicator: '[data-testid="dark-mode-indicator"]',
  },

  // Loading States
  loading: {
    spinner: '[data-testid="loading-spinner"]',
    skeleton: '[data-testid="skeleton-loader"]',
  },

  // Error States
  error: {
    message: '[data-testid="error-message"]',
    retryButton: '[data-testid="retry-button"]',
  },
}