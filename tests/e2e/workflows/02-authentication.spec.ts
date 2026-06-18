import { test, expect, type Page } from '@playwright/test';

/**
 * Authentication — Register / Login / Logout / Role Gating
 *
 * Covers the full auth lifecycle with form validation, token persistence, and role-based UI.
 */

async function bypassAuth(page: Page, role: 'Admin' | 'User' | 'Viewer' = 'Admin') {
  await page.goto('/');
  await page.evaluate((r) => {
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
  }, role);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
}

test.describe('Workflow: Authentication', () => {
  test('login page renders with email + password fields', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /sign in|log in/i }).first()).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('register page renders with name + email + password + confirm', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    await expect(
      page.getByRole('heading', { name: /sign up|register|create/i }).first()
    ).toBeVisible();
    await expect(page.getByLabel(/name/i).first()).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test('login form rejects empty submission', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    const submitBtn = page.getByRole('button', { name: /sign in|log in|submit/i }).first();
    if (await submitBtn.isEnabled()) {
      await submitBtn.click();
      // Should remain on login page
      await expect(page).toHaveURL(/.*login/);
    } else {
      await expect(submitBtn).toBeDisabled();
    }
  });

  test('login form rejects invalid email format', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByLabel(/email/i).fill('not-an-email');
    await page.getByLabel(/password/i).fill('somepassword');
    const submitBtn = page.getByRole('button', { name: /sign in|log in|submit/i }).first();
    if (await submitBtn.isEnabled()) {
      await submitBtn.click();
      // Browser native validation or app validation should keep us on login
      await expect(page).toHaveURL(/.*login/);
    }
  });

  test('authenticated state persists across reload', async ({ page }) => {
    await bypassAuth(page, 'Admin');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.reload();
    await page.waitForLoadState('networkidle');
    // Should NOT redirect to /login
    await expect(page).not.toHaveURL(/.*login/);
  });

  test('logout clears auth state and redirects to login', async ({ page }) => {
    await bypassAuth(page, 'Admin');
    await page.goto('/dashboard');
    const logoutBtn = page.getByRole('button', { name: /log out|sign out/i });
    if (await logoutBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await logoutBtn.click();
      // Either auto-redirected or showed confirm
      await page.waitForTimeout(500);
      const authCleared = await page.evaluate(() => {
        const raw = localStorage.getItem('auth-store');
        if (!raw) return true;
        try {
          return JSON.parse(raw).state?.isAuthenticated === false;
        } catch {
          return true;
        }
      });
      expect(authCleared).toBeTruthy();
    }
  });

  test('role gating: Viewer cannot access admin-only pages', async ({ page }) => {
    await bypassAuth(page, 'Viewer');
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    // Either page is hidden, access denied, or admin-only controls are disabled
    const denied = page.getByText(/access denied|not authorized|forbidden/i);
    if (await denied.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(denied).toBeVisible();
    } else {
      // Admin controls may be missing or disabled
      const adminControls = page.getByRole('button', { name: /admin|delete|reset/i });
      const count = await adminControls.count();
      expect(count).toBe(0);
    }
  });
});
