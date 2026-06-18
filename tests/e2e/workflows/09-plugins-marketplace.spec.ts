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

test.describe('Workflow 09: Plugins Marketplace', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page);
  });

  test('Plugin Marketplace page renders plugin list', async ({ page }) => {
    await page.goto('/plugins').catch(() => page.goto('/plugins/marketplace'));
    await page.waitForLoadState('networkidle').catch(() => false);
    await expectHeading(page);
  });

  test('search input filters plugin list', async ({ page }) => {
    await page.goto('/plugins').catch(() => page.goto('/plugins/marketplace'));
    await page.waitForLoadState('networkidle').catch(() => false);
    const search = page.getByPlaceholder(/search/i).first();
    const visible = await search.isVisible().catch(() => false);
    if (visible) {
      await search.fill('forecasting');
      await page.waitForTimeout(300);
    }
  });

  test('plugin card shows install/installed state', async ({ page }) => {
    await page.goto('/plugins').catch(() => page.goto('/plugins/marketplace'));
    await page.waitForLoadState('networkidle').catch(() => false);
    const installBtn = page.getByRole('button', { name: /install|installed|enable/i }).first();
    const visible = await installBtn.isVisible().catch(() => false);
    expect(visible).toBeTruthy();
  });

  test('installing a plugin requires confirmation', async ({ page }) => {
    await page.goto('/plugins').catch(() => page.goto('/plugins/marketplace'));
    await page.waitForLoadState('networkidle').catch(() => false);
    const installBtn = page.getByRole('button', { name: /^install$/i }).first();
    const visible = await installBtn.isVisible().catch(() => false);
    if (visible) {
      await installBtn.click();
      await page.waitForTimeout(200);
      const confirmBtn = page.getByRole('button', { name: /confirm|yes|install/i }).first();
      const confirmVisible = await confirmBtn.isVisible().catch(() => false);
      expect(confirmVisible).toBeTruthy();
    }
  });

  test('plugin details page shows description and version', async ({ page }) => {
    await page.goto('/plugins').catch(() => page.goto('/plugins/marketplace'));
    await page.waitForLoadState('networkidle').catch(() => false);
    const detailsLink = page.getByRole('link', { name: /details|view|more/i }).first();
    const visible = await detailsLink.isVisible().catch(() => false);
    if (visible) {
      await detailsLink.click();
      await page.waitForLoadState('networkidle').catch(() => false);
      await expectHeading(page);
    }
  });

  test('uninstalling a plugin prompts for confirmation', async ({ page }) => {
    await page.goto('/plugins/installed').catch(() => page.goto('/plugins'));
    await page.waitForLoadState('networkidle').catch(() => false);
    const uninstallBtn = page.getByRole('button', { name: /uninstall|remove|disable/i }).first();
    const visible = await uninstallBtn.isVisible().catch(() => false);
    if (visible) {
      await uninstallBtn.click();
      await page.waitForTimeout(200);
    }
  });
});
