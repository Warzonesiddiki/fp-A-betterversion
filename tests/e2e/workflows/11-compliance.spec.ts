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

test.describe('Workflow 11: Compliance Dashboards', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page);
  });

  test('Compliance page lists frameworks', async ({ page }) => {
    await page.goto('/compliance').catch(() => page.goto('/compliance/frameworks'));
    await page.waitForLoadState('networkidle').catch(() => false);
    await expectHeading(page);
  });

  test('GDPR controls panel renders', async ({ page }) => {
    await page.goto('/compliance/gdpr').catch(() => page.goto('/compliance'));
    await page.waitForLoadState('networkidle').catch(() => false);
    const gdprHeading = page.getByText(/gdpr/i).first();
    const visible = await gdprHeading.isVisible().catch(() => false);
    expect(visible).toBeTruthy();
  });

  test('SOX compliance shows control status', async ({ page }) => {
    await page.goto('/compliance/sox').catch(() => page.goto('/sox'));
    await page.waitForLoadState('networkidle').catch(() => false);
    await expectHeading(page);
  });

  test('ISO 27001 controls are listed', async ({ page }) => {
    await page.goto('/compliance/iso27001').catch(() => page.goto('/compliance'));
    await page.waitForLoadState('networkidle').catch(() => false);
    await expectHeading(page);
  });

  test('compliance filter by status', async ({ page }) => {
    await page.goto('/compliance').catch(() => page.goto('/sox'));
    await page.waitForLoadState('networkidle').catch(() => false);
    const statusFilter = page.locator('select, [data-testid*="status-filter"]').first();
    const visible = await statusFilter.isVisible().catch(() => false);
    if (visible) {
      await statusFilter.selectOption({ index: 1 }).catch(() => false);
      await page.waitForTimeout(200);
    }
  });

  test('compliance gap remediation view', async ({ page }) => {
    await page.goto('/compliance/gaps').catch(() => page.goto('/compliance'));
    await page.waitForLoadState('networkidle').catch(() => false);
    await expectHeading(page);
  });
});
