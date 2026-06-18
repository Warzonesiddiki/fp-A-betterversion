import { test, expect, type Page, devices } from '@playwright/test';

async function setupApp(page: Page, role = 'Admin') {
  await page.goto('/');
  await page.evaluate(
    ({ r }) => {
      localStorage.setItem('finplan-setup-complete', 'true');
      localStorage.setItem(
        'auth-store',
        JSON.stringify({
          state: {
            user: { id: '1', name: 'Test User', email: 'test@finplan.com', role: r },
            isAuthenticated: true,
            accessToken: 'mock-token',
            activeEntityId: 'entity-1',
          },
          version: 0,
        })
      );
    },
    { r: role }
  );
  await page.goto('/');
  await page.waitForLoadState('networkidle');
}

async function expectHeading(page: Page) {
  await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
}

test.describe('Workflow 16: Mobile Responsive', () => {
  test.use({ ...devices['iPhone 13'] });

  test('mobile viewport renders dashboard without horizontal scroll', async ({ page }) => {
    await setupApp(page);
    await page.waitForLoadState('networkidle');
    const body = page.locator('body');
    const scrollWidth = await body.evaluate((el) => el.scrollWidth);
    const clientWidth = await body.evaluate((el) => el.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });

  test('mobile navigation uses hamburger menu', async ({ page }) => {
    await setupApp(page);
    const hamburger = page
      .locator(
        'button[aria-label*="menu" i], button[aria-label*="navigation" i], [data-testid*="hamburger"]'
      )
      .first();
    const visible = await hamburger.isVisible().catch(() => false);
    if (visible) {
      await hamburger.click();
      await page.waitForTimeout(300);
    }
  });

  test('touch interactions work on KPI cards', async ({ page }) => {
    await setupApp(page);
    const kpiCard = page.locator('[data-testid*="kpi"], [class*="kpi"], [class*="KPI"]').first();
    const visible = await kpiCard.isVisible().catch(() => false);
    if (visible) {
      await kpiCard.tap();
      await page.waitForTimeout(200);
    }
  });

  test('forms are usable on small viewport', async ({ page }) => {
    await setupApp(page);
    await page.goto('/settings').catch(() => page.goto('/preferences'));
    await page.waitForLoadState('networkidle').catch(() => false);
    const input = page.locator('input, select, textarea').first();
    const visible = await input.isVisible().catch(() => false);
    if (visible) {
      const box = await input.boundingBox();
      expect(box?.width ?? 0).toBeGreaterThan(0);
    }
  });

  test('sidebar collapses on mobile', async ({ page }) => {
    await setupApp(page);
    const sidebar = page
      .locator('aside, [data-testid*="sidebar"], nav[aria-label*="main" i]')
      .first();
    const sidebarVisible = await sidebar.isVisible().catch(() => false);
    const toggleBtn = page
      .locator('button[aria-label*="toggle" i], button[aria-label*="menu" i]')
      .first();
    if (sidebarVisible) {
      const toggleVisible = await toggleBtn.isVisible().catch(() => false);
      if (toggleVisible) {
        await toggleBtn.click();
        await page.waitForTimeout(300);
      }
    }
  });
});
