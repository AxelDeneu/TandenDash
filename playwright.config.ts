import { defineConfig, devices } from '@playwright/test'
import type { ConfigOptions } from '@nuxt/test-utils/playwright'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '.env.test') })

export default defineConfig<ConfigOptions>({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list'],
  ],
  globalSetup: './tests/e2e/global-setup.ts',
  
  use: {
    baseURL: `http://localhost:${process.env.PORT || 3000}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 45000,
    nuxt: {
      rootDir: '.',
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 14'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: `http://localhost:${process.env.PORT || 3000}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      ...process.env,
      NODE_ENV: 'test',
      DATABASE_URL: 'test.db',
      PORT: process.env.PORT || '3001',
    },
  },
})