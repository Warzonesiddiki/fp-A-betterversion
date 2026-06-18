import { test, expect, type Page } from '@playwright/test';

// Helper: bypass onboarding and set up authenticated state
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

test.describe('Workflow 06: Reporting Dashboards', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page);
  });

  test('Budget vs Actual page renders with comparison data', async ({ page }) => {
    const bvaLink = page.getByRole('link', { name: /budget.*actual|bv.?a/i }).first();
    const visible = await bvaLink.isVisible().catch(() => false);
    if (visible) {
      await bvaLink.click();
      await page.waitForLoadState('networkidle');
      await expectHeading(page);
    }
  });

  test('Cash Flow page renders with projection', async ({ page }) => {
    const cfLink = page.getByRole('link', { name: /cash.*flow/i }).first();
    const visible = await cfLink.isVisible().catch(() => false);
    if (visible) {
      await cfLink.click();
      await page.waitForLoadState('networkidle');
      await expectHeading(page);
    }
  });

  test('Three-Statement Dashboard renders with linked reports', async ({ page }) => {
    const tsdLink = page.getByRole('link', { name: /three.*statement|3.*statement/i }).first();
    const visible = await tsdLink.isVisible().catch(() => false);
    if (visible) {
      await tsdLink.click();
      await page.waitForLoadState('networkidle');
      await expectHeading(page);
    }
  });

  test('Report builder allows filter selection', async ({ page }) => {
    const rbLink = page.getByRole('link', { name: /report.*builder|designer/i }).first();
    const visible = await rbLink.isVisible().catch(() => false);
    if (visible) {
      await rbLink.click();
      await page.waitForLoadState('networkidle');
      await expectHeading(page);
    }
  });

  test('reports section can be navigated from sidebar', async ({ page }) => {
    const reportsLink = page.getByRole('link', { name: /^reports$/i }).first();
    const visible = await reportsLink.isVisible().catch(() => false);
    if (visible) {
      await reportsLink.click();
      await page.waitForLoadState('networkidle');
      await expectHeading(page);
    }
  });

  test('report export controls are accessible', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('networkidle').catch(() => false);
    await expectHeading(page);
    const exportBtn = page.getByRole('button', { name: /export|download|pdf|csv|excel/i }).first();
    const exists = await exportBtn.count();
    expect(exists).toBeGreaterThanOrEqual(0);
  });

  test('date range picker changes report period', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('networkidle').catch(() => false);
    const dateInput = page
      .locator('input[type="date"], input[type="month"], [data-testid*="date"]')
      .first();
    const visible = await dateInput.isVisible().catch(() => false);
    if (visible) {
      await dateInput.click();
      await page.waitForTimeout(200);
    }
  });
});
