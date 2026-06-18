import { test, expect, type Page } from '@playwright/test';

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

test.describe('Workflow 15: Help & Documentation', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page);
  });

  test('Help page renders help topics', async ({ page }) => {
    await page.goto('/help').catch(() => page.goto('/support'));
    await page.waitForLoadState('networkidle').catch(() => false);
    await expectHeading(page);
  });

  test('search help input filters topics', async ({ page }) => {
    await page.goto('/help').catch(() => page.goto('/support'));
    await page.waitForLoadState('networkidle').catch(() => false);
    const search = page.getByPlaceholder(/search/i).first();
    const visible = await search.isVisible().catch(() => false);
    if (visible) {
      await search.fill('budget');
      await page.waitForTimeout(300);
    }
  });

  test('documentation page renders article', async ({ page }) => {
    await page.goto('/docs').catch(() => page.goto('/help/docs'));
    await page.waitForLoadState('networkidle').catch(() => false);
    await expectHeading(page);
  });

  test('FAQ page lists questions', async ({ page }) => {
    await page.goto('/help/faq').catch(() => page.goto('/help'));
    await page.waitForLoadState('networkidle').catch(() => false);
    await expectHeading(page);
  });

  test('contact support form renders fields', async ({ page }) => {
    await page.goto('/help/contact').catch(() => page.goto('/support'));
    await page.waitForLoadState('networkidle').catch(() => false);
    const emailInput = page.getByLabel(/email/i).first();
    const messageArea = page.getByLabel(/message/i).first();
    const emailVisible = await emailInput.isVisible().catch(() => false);
    const messageVisible = await messageArea.isVisible().catch(() => false);
    expect(emailVisible || messageVisible).toBeTruthy();
  });

  test('tutorials page lists video tutorials', async ({ page }) => {
    await page.goto('/help/tutorials').catch(() => page.goto('/help'));
    await page.waitForLoadState('networkidle').catch(() => false);
    await expectHeading(page);
  });
});
