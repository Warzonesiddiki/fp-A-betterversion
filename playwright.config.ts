import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 60000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    // Cold-start Vite on-demand compilation of the entry graph can exceed
    // 30s on the very first document of a fresh dev server.
    navigationTimeout: 60_000,
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
    // Mirror dev/staging auth behavior for E2E (same rationale as vitest's
    // env block in vite.config.ts): without it login() routes to
    // loginReal(), which throws "Real authentication is not configured".
    env: { VITE_USE_MOCK_AUTH: 'true' },
  },
});
