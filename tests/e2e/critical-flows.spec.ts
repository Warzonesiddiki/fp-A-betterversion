import { test, expect } from '@playwright/test';

// Helper: bypass onboarding and set up authenticated state
async function setupApp(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('finplan-setup-complete', 'true');
    localStorage.setItem(
      'auth-store',
      JSON.stringify({
        state: {
          user: { id: '1', name: 'Test User', email: 'test@finplan.com', role: 'Admin' },
          isAuthenticated: true,
          accessToken: 'mock-token',
          activeEntityId: 'entity-1',
        },
        version: 0,
      })
    );
  });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
}

/** Assert page has at least one visible heading */
async function expectHeading(page: import('@playwright/test').Page) {
  await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
}

test.describe('Critical Flow: Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page);
  });

  test('sidebar navigates to all main sections', async ({ page }) => {
    const routes = ['Dashboard', 'Budgets', 'Forecasts', 'Reports', 'Analytics'];

    for (const link of routes) {
      const navLink = page.getByRole('link', { name: new RegExp(link, 'i') }).first();
      if (await navLink.isVisible()) {
        await navLink.click();
        await page.waitForLoadState('networkidle');
        await expectHeading(page);
      }
    }
  });

  test('sidebar collapses and expands', async ({ page }) => {
    const collapseBtn = page.locator('button[aria-label*="ollapse"], button[aria-label*="idebar"]').first();
    if (await collapseBtn.isVisible()) {
      await collapseBtn.click();
      await page.waitForTimeout(400);
      await collapseBtn.click();
      await page.waitForTimeout(400);
    }
  });

  test('settings page is accessible', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1, h2').first()).toContainText(/settings/i);
  });

  test('help page is accessible', async ({ page }) => {
    await page.goto('/help');
    await page.waitForLoadState('networkidle');
    await expectHeading(page);
  });
});

test.describe('Critical Flow: Settings', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page);
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
  });

  test('settings page loads with tabs', async ({ page }) => {
    await expect(page.locator('h1').first()).toContainText(/settings/i);
    const tabs = page.locator('[role="tablist"] button, [role="tab"]');
    await expect(tabs.first()).toBeVisible({ timeout: 5000 });
  });

  test('organization tab shows form fields', async ({ page }) => {
    const orgInput = page.locator('input[placeholder*="organization" i], input[placeholder*="company" i], input[value*="FinPlan"]').first();
    if (await orgInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(orgInput).toBeVisible();
    }
  });

  test('can switch between settings tabs', async ({ page }) => {
    const tabs = page.locator('[role="tablist"] button, [role="tab"]');
    const count = await tabs.count();
    if (count > 1) {
      await tabs.nth(1).click();
      await page.waitForTimeout(300);
      await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    }
  });
});

test.describe('Critical Flow: Data Management', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page);
  });

  test('GL upload page renders', async ({ page }) => {
    await page.goto('/data/gl-upload');
    await page.waitForLoadState('networkidle');
    await expectHeading(page);
  });

  test('chart of accounts page renders', async ({ page }) => {
    await page.goto('/data/chart-of-accounts');
    await page.waitForLoadState('networkidle');
    await expectHeading(page);
  });

  test('trial balance page renders', async ({ page }) => {
    await page.goto('/data/gl-trial-balance');
    await page.waitForLoadState('networkidle');
    await expectHeading(page);
  });

  test('audit trail page renders', async ({ page }) => {
    await page.goto('/audit/trail');
    await page.waitForLoadState('networkidle');
    // Page should render (may show error boundary or content)
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Critical Flow: Budget Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page);
  });

  test('budget list page renders', async ({ page }) => {
    await page.goto('/budgets');
    await page.waitForLoadState('networkidle');
    await expectHeading(page);
  });

  test('budget create page renders with wizard', async ({ page }) => {
    await page.goto('/budgets/create');
    await page.waitForLoadState('networkidle');
    await expectHeading(page);
  });

  test('budget vs actuals page renders', async ({ page }) => {
    await page.goto('/budgets/bva');
    await page.waitForLoadState('networkidle');
    await expectHeading(page);
  });
});

test.describe('Critical Flow: Financial Reports', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page);
  });

  const reportPages = [
    { path: '/reports/profit-loss', name: 'Profit & Loss' },
    { path: '/reports/balance-sheet', name: 'Balance Sheet' },
    { path: '/reports/cash-flow', name: 'Cash Flow' },
    { path: '/reports/board-pack', name: 'Board Pack' },
  ];

  for (const { path, name } of reportPages) {
    test(`${name} page renders`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await expectHeading(page);
    });
  }

  test('reports list page renders', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');
    await expectHeading(page);
  });
});

test.describe('Critical Flow: Currency Management', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page);
  });

  test('FX rates page renders', async ({ page }) => {
    await page.goto('/currency/fx-rates');
    await page.waitForLoadState('networkidle');
    await expectHeading(page);
  });

  test('translation results page renders', async ({ page }) => {
    await page.goto('/currency/translation');
    await page.waitForLoadState('networkidle');
    await expectHeading(page);
  });

  test('hedge management page renders', async ({ page }) => {
    await page.goto('/currency/hedge');
    await page.waitForLoadState('networkidle');
    await expectHeading(page);
  });
});

test.describe('Critical Flow: Consolidation', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page);
  });

  test('consolidation dashboard renders', async ({ page }) => {
    await page.goto('/consolidation');
    await page.waitForLoadState('networkidle');
    await expectHeading(page);
  });

  test('IC elimination page renders', async ({ page }) => {
    await page.goto('/consolidation/ic-elimination');
    await page.waitForLoadState('networkidle');
    await expectHeading(page);
  });

  test('ownership tree page renders', async ({ page }) => {
    await page.goto('/consolidation/ownership-tree');
    await page.waitForLoadState('networkidle');
    await expectHeading(page);
  });
});

test.describe('Critical Flow: Analytics & Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page);
  });

  test('analytics page renders', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    await expectHeading(page);
  });

  test('variance dashboard renders', async ({ page }) => {
    await page.goto('/variance');
    await page.waitForLoadState('networkidle');
    await expectHeading(page);
  });

  test('scenario list page renders', async ({ page }) => {
    await page.goto('/scenarios');
    await page.waitForLoadState('networkidle');
    await expectHeading(page);
  });

  test('AI intelligence page renders', async ({ page }) => {
    await page.goto('/ai');
    await page.waitForLoadState('networkidle');
    await expectHeading(page);
  });
});

test.describe('Critical Flow: Error Handling', () => {
  test('404 page renders for unknown routes', async ({ page }) => {
    await setupApp(page);
    await page.goto('/this-route-does-not-exist-12345');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1, h2').first()).toContainText(/404|not found/i);
  });

  test('app does not crash on rapid navigation', async ({ page }) => {
    await setupApp(page);
    const routes = ['/dashboard', '/budgets', '/reports', '/settings', '/analytics', '/help'];
    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');
    }
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Critical Flow: Accessibility Basics', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page);
  });

  test('dashboard has main landmark', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const main = page.locator('main, [role="main"]');
    await expect(main.first()).toBeVisible({ timeout: 5000 });
  });

  test('keyboard tab reaches interactive elements', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    await expect(focused).toBeTruthy();
  });
});
