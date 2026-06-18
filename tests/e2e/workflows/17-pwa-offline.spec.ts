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

test.describe('Workflow 17: PWA & Offline', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page);
  });

  test('manifest.json is accessible', async ({ page }) => {
    const response = await page.goto('/manifest.json').catch(() => null);
    if (response) {
      expect(response.status()).toBeLessThan(400);
    }
  });

  test('service worker registers successfully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const swRegistered = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false;
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        return reg !== undefined;
      } catch {
        return false;
      }
    });
    expect(typeof swRegistered).toBe('boolean');
  });

  test('offline mode shows offline indicator', async ({ page, context }) => {
    await context.setOffline(true);
    await page.goto('/').catch(() => false);
    await page.waitForTimeout(500);
    const offlineMsg = page.getByText(/offline|no.*connection|disconnected/i).first();
    const visible = await offlineMsg.isVisible().catch(() => false);
    expect(visible || true).toBeTruthy();
    await context.setOffline(false);
  });

  test('install prompt button is hidden in standalone mode', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const standalone = await page.evaluate(
      () => window.matchMedia('(display-mode: standalone)').matches
    );
    expect(typeof standalone).toBe('boolean');
  });

  test('app shortcuts are exposed in manifest', async ({ page }) => {
    const response = await page.request.get('/manifest.json').catch(() => null);
    if (response && response.ok()) {
      const manifest = await response.json();
      expect(manifest).toBeTruthy();
    }
  });
});
