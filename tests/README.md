# E2E Testing for TandenDash

This directory contains end-to-end (E2E) tests for the TandenDash application using Playwright.

## 📁 Test Structure

```
tests/e2e/
├── fixtures/          # Test data and configuration
│   └── test-data.ts   # Common test data objects
├── pages/             # Page Object Model classes
│   └── dashboard.page.ts  # Main dashboard page object
├── specs/             # Test specifications
│   ├── smoke.spec.ts          # Basic smoke tests
│   ├── navigation.spec.ts     # Navigation and page tests
│   ├── widget-management.spec.ts  # Widget CRUD operations
│   └── dark-mode.spec.ts      # Dark mode functionality
├── utils/             # Helper utilities
│   ├── helpers.ts     # Common test helper functions
│   └── selectors.ts   # CSS selectors and element locators
└── global-setup.ts    # Global test setup and teardown
```

## 🚀 Running Tests

### Prerequisites

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install Playwright browsers:
   ```bash
   npm run test:install
   ```

3. Start the development server (in another terminal):
   ```bash
   npm run dev
   ```

### Test Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (visible browser)
npm run test:e2e:headed

# Run specific test suites
npm run test:e2e:smoke        # Basic functionality
npm run test:e2e:navigation   # Page navigation
npm run test:e2e:widgets      # Widget management
npm run test:e2e:darkmode     # Dark mode toggle

# Run tests on specific browser
npm run test:e2e:chrome       # Chrome only
npm run test:e2e -- --project=firefox  # Firefox only

# Debug tests (step through with debugger)
npm run test:e2e:debug
```

## 🧪 Test Coverage

### Smoke Tests (`smoke.spec.ts`)
- ✅ Application loads successfully
- ✅ Key elements are visible
- ✅ Mobile responsiveness
- ✅ Debug information display
- ✅ Edit mode functionality

### Navigation Tests (`navigation.spec.ts`)
- ✅ Page loading and initialization
- ✅ Navigation controls visibility
- ✅ Debug area information
- ✅ Context menu functionality
- ✅ Window resize handling
- ✅ Carousel functionality

### Widget Management Tests (`widget-management.spec.ts`)
- ✅ Edit mode toggle
- ✅ Widget addition workflow
- ✅ Widget deletion
- ✅ Grid overlay in edit mode
- ✅ Widget persistence after reload
- ✅ Configuration dialogs

### Dark Mode Tests (`dark-mode.spec.ts`)
- ✅ Triple-tap toggle functionality
- ✅ Setting persistence across reloads
- ✅ Style application verification
- ✅ Mobile touch support
- ✅ Center-tap requirement
- ✅ Timeout and reset behavior

## 🏗️ Test Architecture

### Page Object Model (POM)
Tests use the Page Object Model pattern for maintainable and reusable test code:

```typescript
// Example usage
const dashboardPage = new DashboardPage(page)
await dashboardPage.goto()
await dashboardPage.enableEditMode()
await dashboardPage.addWidget('Clock', { showSeconds: true })
```

### Helper Functions
Common operations are abstracted into helper functions:

```typescript
// TestHelpers class provides utilities for:
- Widget management (add, delete, configure)
- Navigation (page switching, carousel)
- Dark mode (triple-tap, verification)
- Drag & drop operations
- Error handling and recovery
```

### Selectors Strategy
Selectors are centralized and prioritized by reliability:

1. **Test IDs** - `[data-testid="element"]` (most reliable)
2. **ARIA attributes** - `[role="button"]`, `[aria-label="Close"]`
3. **Semantic elements** - `button:has-text("Edit Mode")`
4. **CSS classes** - `.fixed.top-4.left-4` (least reliable)

## 📊 CI/CD Integration

### GitHub Actions
The repository includes automated testing workflows:

- **Full Test Suite**: Runs on all browsers (Chrome, Firefox, Safari)
- **Smoke Tests**: Quick validation on pull requests
- **Mobile Tests**: Responsive design validation

### Test Reports
- HTML reports are generated in `playwright-report/`
- Screenshots and videos are captured on failures
- Test artifacts are uploaded to GitHub Actions

## 🛠️ Configuration

### Playwright Config (`playwright.config.ts`)
- **Base URL**: `http://localhost:3000`
- **Browsers**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Retries**: 2 retries in CI, 0 locally
- **Timeouts**: 10s action timeout, 30s navigation timeout
- **Artifacts**: Screenshots on failure, videos on failure, traces on retry

### Global Setup (`global-setup.ts`)
- Database isolation for tests
- Browser pre-warming
- Environment preparation

## 🔧 Troubleshooting

### Common Issues

1. **Tests failing due to timing**
   - Use `page.waitForLoadState('networkidle')` before assertions
   - Add appropriate `waitForTimeout` for animations
   - Use `expect().toBeVisible()` instead of checking visibility manually

2. **Element not found errors**
   - Check if selectors match the actual DOM structure
   - Use `.first()` or `.nth(index)` for multiple elements
   - Verify elements are in viewport with `toBeInViewport()`

3. **Database state issues**
   - Tests use isolated test database (`data.test.db`)
   - Clear application state between tests if needed
   - Check that widgets/pages persist correctly

### Debug Tips

1. **Visual debugging**:
   ```bash
   npm run test:e2e:headed  # See browser actions
   npm run test:e2e:ui      # Interactive test runner
   ```

2. **Step-by-step debugging**:
   ```bash
   npm run test:e2e:debug   # Built-in debugger
   ```

3. **Screenshots and videos**:
   - Check `test-results/` folder for failure artifacts
   - Videos show complete test execution

## 📈 Extending Tests

### Adding New Test Cases

1. **Create test file** in `tests/e2e/specs/`
2. **Use Page Objects** for reusable interactions
3. **Add test data** to `fixtures/test-data.ts`
4. **Update selectors** in `utils/selectors.ts`
5. **Add npm script** in `package.json`

### Widget-Specific Tests

For new widgets, create dedicated test files:

```typescript
// tests/e2e/specs/widget-weather.spec.ts
test.describe('Weather Widget', () => {
  test('should display weather data', async ({ page }) => {
    const dashboardPage = new DashboardPage(page)
    await dashboardPage.addWidget('Weather', {
      apiKey: 'test-key',
      location: 'New York'
    })
    
    const weatherWidget = await dashboardPage.getWeatherWidget()
    await expect(weatherWidget.temperature).toBeVisible()
  })
})
```

## 📋 Test Standards

1. **Test Names**: Use descriptive names starting with "should"
2. **Assertions**: Always use meaningful expect messages
3. **Setup/Teardown**: Use `beforeEach` for common setup
4. **Data**: Use test fixtures instead of hardcoded values
5. **Flakiness**: Add proper waits and stable selectors
6. **Documentation**: Comment complex test logic

## 🎯 Future Enhancements

- [ ] Visual regression testing with screenshot comparison
- [ ] Performance testing with Lighthouse integration
- [ ] API testing for backend endpoints
- [ ] Accessibility testing with axe-core
- [ ] Cross-browser compatibility matrix
- [ ] Test data management and seeding
- [ ] Parallel test execution optimization