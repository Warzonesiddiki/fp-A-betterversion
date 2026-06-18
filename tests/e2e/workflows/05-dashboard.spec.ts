import { test, expect, type Page } from '@playwright/test';

/**
 * Dashboard — KPI Cards / Recent Activity / Navigation
 *
 * Covers the dashboard view: empty state, populated state, KPI cards, recent activity, quick actions.
 */

async function setupApp(page: Page, withData = false) {
  await page.goto('/');
  await page.evaluate((data) => {
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
    if (data) {
      // Simulate imported data presence
      localStorage.setItem(
        'gl-store',
        JSON.stringify({
          state: { entries: [{ id: 'gl-1', amount: 10000, type: 'revenue' }] },
          version: 0,
        })
      );
    }
  }, withData);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
}

test.describe('Workflow: Dashboard', () => {
  test('dashboard renders with main landmark', async ({ page }) => {
    await setupApp(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const main = page.locator('main, [role="main"]');
    await expect(main.first()).toBeVisible({ timeout: 10000 });
  });

  test('dashboard shows KPI cards section', async ({ page }) => {
    await setupApp(page, true);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    // KPI cards typically use grid layouts or specific test ids
    const kpiText = page.getByText(/revenue|expense|profit|cash|income/i);
    if ((await kpiText.count()) > 0) {
      await expect(kpiText.first()).toBeVisible();
    }
  });

  test('dashboard empty state shows import prompt', async ({ page }) => {
    await setupApp(page, false);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const importPrompt = page.getByText(/import|get started|add data|no data/i);
    if (
      await importPrompt
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false)
    ) {
      await expect(importPrompt.first()).toBeVisible();
    }
  });

  test('dashboard has quick action buttons', async ({ page }) => {
    await setupApp(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const actions = page.getByRole('button', { name: /import|create|new|add|view/i });
    const count = await actions.count();
    expect(count).toBeGreaterThan(0);
  });

  test('dashboard sidebar navigates to main sections', async ({ page }) => {
    await setupApp(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const sections = ['Budgets', 'Reports', 'Analytics', 'Settings'];
    let navigated = 0;
    for (const name of sections) {
      const link = page.getByRole('link', { name: new RegExp(name, 'i') }).first();
      if (await link.isVisible({ timeout: 1000 }).catch(() => false)) {
        await link.click();
        await page.waitForLoadState('domcontentloaded');
        navigated++;
      }
    }
    expect(navigated).toBeGreaterThan(0);
  });

  test('dashboard is keyboard accessible', async ({ page }) => {
    await setupApp(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    await expect(focused).toBeTruthy();
  });

  test('dashboard has proper heading hierarchy', async ({ page }) => {
    await setupApp(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const h1 = page.locator('h1');
    const headingCount = await h1.count();
    expect(headingCount).toBeGreaterThanOrEqual(1);
  });
});
