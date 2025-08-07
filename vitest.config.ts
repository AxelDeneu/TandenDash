/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import path from 'path'
import { fileURLToPath } from 'url'
import vue from '@vitejs/plugin-vue'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '~': path.resolve(__dirname, '.'),
      '@@': path.resolve(__dirname, '.'),
      '~~': path.resolve(__dirname, '.'),
      '#app': path.resolve(__dirname, 'tests/unit/mocks/app.ts'),
    }
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['tests/unit/setup/vitest.setup.ts'],
    include: ['tests/unit/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,tsx}'],
    exclude: [
      'tests/e2e/**',
      'tests/unit/setup/**',
      'tests/unit/helpers/**',
      'tests/unit/mocks/**',
      'node_modules/**',
      'dist/**',
      '.nuxt/**'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'tests/**',
        'node_modules/**',
        'dist/**',
        '.nuxt/**',
        'coverage/**',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        '**/types/**',
        'widgets/**',
        'scripts/**',
        'drizzle/**',
        'public/**'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 85,
          statements: 85
        }
      }
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true // Important for SQLite in-memory tests
      }
    }
  }
})