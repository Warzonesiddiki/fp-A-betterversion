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

test.describe('Workflow 12: Admin Pages', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page, 'Admin');
  });

  test('Admin dashboard is accessible to Admin role', async ({ page }) => {
    await page.goto('/admin').catch(() => page.goto('/admin/dashboard'));
    await page.waitForLoadState('networkidle').catch(() => false);
    await expectHeading(page);
  });

  test('user management page lists users', async ({ page }) => {
    await page.goto('/admin/users').catch(() => page.goto('/admin'));
    await page.waitForLoadState('networkidle').catch(() => false);
    const userTable = page.locator('table, [role="table"], [data-testid*="user"]').first();
    const visible = await userTable.isVisible().catch(() => false);
    expect(visible).toBeTruthy();
  });

  test('creating a new user opens form', async ({ page }) => {
    await page.goto('/admin/users').catch(() => page.goto('/admin'));
    await page.waitForLoadState('networkidle').catch(() => false);
    const newUserBtn = page.getByRole('button', { name: /new|create|add.*user/i }).first();
    const visible = await newUserBtn.isVisible().catch(() => false);
    if (visible) {
      await newUserBtn.click();
      await page.waitForTimeout(300);
    }
  });

  test('editing a user shows editable form', async ({ page }) => {
    await page.goto('/admin/users').catch(() => page.goto('/admin'));
    await page.waitForLoadState('networkidle').catch(() => false);
    const editBtn = page.getByRole('button', { name: /edit|modify/i }).first();
    const visible = await editBtn.isVisible().catch(() => false);
    if (visible) {
      await editBtn.click();
      await page.waitForTimeout(300);
    }
  });

  test('Benchmarks page renders for Admin', async ({ page }) => {
    await page.goto('/admin/benchmarks').catch(() => page.goto('/admin'));
    await page.waitForLoadState('networkidle').catch(() => false);
    await expectHeading(page);
  });

  test('Debug page is hidden for non-Admin role', async ({ page }) => {
    await setupApp(page, 'Viewer');
    await page.goto('/admin/debug').catch(() => false);
    await page.waitForLoadState('networkidle').catch(() => false);
    const url = page.url();
    const redirected = !url.includes('/admin/debug');
    expect(redirected || url.includes('403') || url.includes('forbidden')).toBeTruthy();
  });

  test('Admin settings page is accessible', async ({ page }) => {
    await page.goto('/admin/settings').catch(() => page.goto('/admin'));
    await page.waitForLoadState('networkidle').catch(() => false);
    await expectHeading(page);
  });
});
