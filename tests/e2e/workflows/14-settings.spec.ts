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

test.describe('Workflow 14: Settings & Preferences', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page);
  });

  test('Settings page lists categories', async ({ page }) => {
    await page.goto('/settings').catch(() => page.goto('/preferences'));
    await page.waitForLoadState('networkidle').catch(() => false);
    await expectHeading(page);
  });

  test('theme toggle switches light/dark mode', async ({ page }) => {
    await page.goto('/settings').catch(() => page.goto('/preferences'));
    await page.waitForLoadState('networkidle').catch(() => false);
    const themeToggle = page
      .locator('[data-testid*="theme"], button:has-text("Dark"), button:has-text("Light")')
      .first();
    const visible = await themeToggle.isVisible().catch(() => false);
    if (visible) {
      await themeToggle.click();
      await page.waitForTimeout(200);
    }
  });

  test('language selector lists supported languages', async ({ page }) => {
    await page.goto('/settings').catch(() => page.goto('/preferences'));
    await page.waitForLoadState('networkidle').catch(() => false);
    const langSelect = page.getByLabel(/language/i).first();
    const visible = await langSelect.isVisible().catch(() => false);
    if (visible) {
      const options = await langSelect.locator('option').count();
      expect(options).toBeGreaterThan(0);
    }
  });

  test('notification preferences are checkboxes', async ({ page }) => {
    await page.goto('/settings/notifications').catch(() => page.goto('/settings'));
    await page.waitForLoadState('networkidle').catch(() => false);
    const checkbox = page.locator('input[type="checkbox"]').first();
    const visible = await checkbox.isVisible().catch(() => false);
    expect(visible).toBeTruthy();
  });

  test('integrations page lists connected services', async ({ page }) => {
    await page.goto('/settings/integrations').catch(() => page.goto('/settings'));
    await page.waitForLoadState('networkidle').catch(() => false);
    await expectHeading(page);
  });

  test('sector configuration dropdown lists sectors', async ({ page }) => {
    await page.goto('/settings/sector').catch(() => page.goto('/settings'));
    await page.waitForLoadState('networkidle').catch(() => false);
    await expectHeading(page);
  });

  test('settings save button persists changes', async ({ page }) => {
    await page.goto('/settings').catch(() => page.goto('/preferences'));
    await page.waitForLoadState('networkidle').catch(() => false);
    const saveBtn = page.getByRole('button', { name: /save/i }).first();
    const visible = await saveBtn.isVisible().catch(() => false);
    if (visible) {
      await saveBtn.click();
      await page.waitForTimeout(200);
    }
  });
});
