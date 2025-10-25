import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration for Alter app
 * Tests responsive design, API mocking, and user flows
 */
export default defineConfig({
  testDir: './tests/e2e',

  // Maximum time one test can run
  timeout: 60 * 1000,

  // Test execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }],
    ['list']
  ],

  // Shared settings for all tests
  use: {
    // Base URL for the application
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',

    // Collect trace on first retry
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Viewport will be set per project
    locale: 'fr-FR',

    // Timeout for actions
    actionTimeout: 10 * 1000,
  },

  // Configure projects for different viewports and browsers
  projects: [
    // Desktop tests
    {
      name: 'Desktop Chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'Desktop Firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'Desktop Safari',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 },
      },
    },

    // Tablet tests
    {
      name: 'iPad Pro',
      use: {
        ...devices['iPad Pro'],
      },
    },
    {
      name: 'iPad Mini',
      use: {
        ...devices['iPad Mini'],
      },
    },

    // Mobile tests
    {
      name: 'iPhone 14 Pro',
      use: {
        ...devices['iPhone 14 Pro'],
      },
    },
    {
      name: 'iPhone 12',
      use: {
        ...devices['iPhone 12'],
      },
    },
    {
      name: 'Pixel 7',
      use: {
        ...devices['Pixel 7'],
      },
    },
    {
      name: 'Galaxy S23',
      use: {
        ...devices['Galaxy S9+'], // Using S9+ as closest match
        viewport: { width: 360, height: 780 },
      },
    },

    // Small mobile
    {
      name: 'Small Mobile',
      use: {
        ...devices['iPhone SE'],
      },
    },
  ],

  // Run local dev server before tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})
