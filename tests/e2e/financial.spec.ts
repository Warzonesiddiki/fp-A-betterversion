import { test, expect } from '@playwright/test';

test.describe('Financial Pages', () => {
  const pages = [
    { path: '/', name: 'Dashboard' },
    { path: '/reports/profit-loss', name: 'P&L' },
    { path: '/reports/balance-sheet', name: 'Balance Sheet' },
    { path: '/reports/cash-flow', name: 'Cash Flow' },
    { path: '/budgets', name: 'Budgets' },
    { path: '/consolidation', name: 'Consolidation' },
    { path: '/data/chart-of-accounts', name: 'Chart of Accounts' },
  ];

  for (const { path, name } of pages) {
    test(`${name} page renders`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
    });
  }
});
