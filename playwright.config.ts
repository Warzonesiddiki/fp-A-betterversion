import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 60000,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // P0A-19 Web Vitals — Desktop Chrome baseline for CWV measurement
    {
      name: 'web-vitals',
      testMatch: /24-web-vitals\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'] },
      timeout: 60_000,
      workers: 1,
    },
    // P0A-15 Mobile / PWA — iPhone 13 viewport (390x844)
    {
      name: 'mobile-iphone',
      testMatch: /25-mobile-responsive\.spec\.ts$/,
      use: { ...devices['iPhone 13'] },
      timeout: 60_000,
      workers: 1,
    },
    // P0A-15 Mobile / PWA — iPad tablet (768x1024)
    {
      name: 'tablet-ipad',
      testMatch: /25-mobile-responsive\.spec\.ts$/,
      use: { ...devices['iPad (gen 7)'] },
      timeout: 60_000,
      workers: 1,
    },
    // P0A-15 Mobile / PWA — landscape orientation
    {
      name: 'mobile-landscape',
      testMatch: /25-mobile-responsive\.spec\.ts$/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 812, height: 375 },
      },
      timeout: 60_000,
      workers: 1,
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
