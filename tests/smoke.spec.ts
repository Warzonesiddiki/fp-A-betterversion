import { test, expect } from '@playwright/test';

test.describe('FinPlan Pro Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Bypass onboarding wizard
    await page.evaluate(() => {
      localStorage.setItem('finplan-setup-complete', 'true');
    });
    // Reload to apply bypass
    await page.goto('/');
  });

  test('app loads and shows dashboard or welcome', async ({ page }) => {
    // Dashboard shows h1 "Executive Dashboard" if data exists,
    // or h2 "Welcome to FinPlan Pro" (from DashboardPage empty state) if empty.
    const heading = page.locator('h1, h2');
    await expect(heading.first()).toContainText(['Dashboard', 'Welcome']);
  });

  test('GL upload page renders', async ({ page }) => {
    await page.goto('/data/gl-upload');
    await expect(page.getByRole('heading')).toContainText([
      'Data Import',
      'Import Your Financial Data',
    ]);
  });

  test('chart of accounts page renders', async ({ page }) => {
    await page.goto('/data/chart-of-accounts');
    await expect(page.getByRole('heading')).toContainText('Chart of Accounts');
  });

  test('trial balance page renders', async ({ page }) => {
    await page.goto('/data/gl-trial-balance');
    await expect(page.getByRole('heading')).toContainText('Trial Balance');
  });

  test('budget list page renders', async ({ page }) => {
    await page.goto('/budgets');
    await expect(page.getByRole('heading')).toContainText(['Budgets', 'No Budgets']);
  });

  test('P&L page renders', async ({ page }) => {
    await page.goto('/reports/profit-loss');
    await expect(page.getByRole('heading')).toContainText(['Profit & Loss', 'No Data']);
  });

  test('balance sheet page renders', async ({ page }) => {
    await page.goto('/reports/balance-sheet');
    await expect(page.getByRole('heading')).toContainText(['Balance Sheet', 'No Data']);
  });

  test('cash flow page renders', async ({ page }) => {
    await page.goto('/reports/cash-flow');
    await expect(page.getByRole('heading')).toContainText(['Cash Flow', 'No Data']);
  });

  test('404 page shows for unknown routes', async ({ page }) => {
    await page.goto('/nonexistent-page');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('404');
  });

  test('help page renders', async ({ page }) => {
    await page.goto('/help');
    await expect(page.getByRole('heading')).toContainText('Help');
  });
});
