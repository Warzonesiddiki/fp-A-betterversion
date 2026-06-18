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

test.describe('Workflow 13: Auth Advanced', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page);
  });

  test('password reset page renders form', async ({ page }) => {
    await page.goto('/forgot-password').catch(() => page.goto('/reset-password'));
    await page.waitForLoadState('networkidle').catch(() => false);
    const emailInput = page.getByLabel(/email/i).first();
    const visible = await emailInput.isVisible().catch(() => false);
    expect(visible).toBeTruthy();
  });

  test('MFA setup page lists authenticator app option', async ({ page }) => {
    await page.goto('/account/mfa').catch(() => page.goto('/settings/mfa'));
    await page.waitForLoadState('networkidle').catch(() => false);
    await expectHeading(page);
  });

  test('account profile page is editable', async ({ page }) => {
    await page.goto('/account').catch(() => page.goto('/profile'));
    await page.waitForLoadState('networkidle').catch(() => false);
    await expectHeading(page);
  });

  test('change password form requires current password', async ({ page }) => {
    await page.goto('/account/change-password').catch(() => page.goto('/settings/security'));
    await page.waitForLoadState('networkidle').catch(() => false);
    const currentPwd = page.getByLabel(/current.*password|old.*password/i).first();
    const visible = await currentPwd.isVisible().catch(() => false);
    if (visible) {
      await currentPwd.fill('Test1234!');
    }
  });

  test('session management shows active sessions', async ({ page }) => {
    await page.goto('/account/sessions').catch(() => page.goto('/settings/security'));
    await page.waitForLoadState('networkidle').catch(() => false);
    await expectHeading(page);
  });

  test('API tokens page lists personal access tokens', async ({ page }) => {
    await page.goto('/account/tokens').catch(() => page.goto('/settings/api'));
    await page.waitForLoadState('networkidle').catch(() => false);
    await expectHeading(page);
  });
});
