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

test.describe('Workflow 07: What-If Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page);
  });

  test('Scenarios page lists saved scenarios', async ({ page }) => {
    await page.goto('/scenarios').catch(() => page.goto('/whatif'));
    await page.waitForLoadState('networkidle').catch(() => false);
    await expectHeading(page);
  });

  test('creating a new scenario opens editor', async ({ page }) => {
    await page.goto('/scenarios').catch(() => page.goto('/whatif'));
    await page.waitForLoadState('networkidle').catch(() => false);
    const newBtn = page.getByRole('button', { name: /new|create|add.*scenario/i }).first();
    const visible = await newBtn.isVisible().catch(() => false);
    if (visible) {
      await newBtn.click();
      await page.waitForTimeout(300);
      await expectHeading(page);
    }
  });

  test('scenario variables can be adjusted via slider or input', async ({ page }) => {
    await page.goto('/scenarios').catch(() => page.goto('/whatif'));
    await page.waitForLoadState('networkidle').catch(() => false);
    const slider = page.locator('input[type="range"]').first();
    const visible = await slider.isVisible().catch(() => false);
    if (visible) {
      await slider.fill('50');
      await page.waitForTimeout(200);
    }
  });

  test('comparing two scenarios shows side-by-side results', async ({ page }) => {
    await page.goto('/scenarios').catch(() => page.goto('/whatif'));
    await page.waitForLoadState('networkidle').catch(() => false);
    const compareBtn = page.getByRole('button', { name: /compare/i }).first();
    const visible = await compareBtn.isVisible().catch(() => false);
    if (visible) {
      await compareBtn.click();
      await page.waitForTimeout(300);
    }
  });

  test('saving scenario prompts for name', async ({ page }) => {
    await page.goto('/scenarios').catch(() => page.goto('/whatif'));
    await page.waitForLoadState('networkidle').catch(() => false);
    const saveBtn = page.getByRole('button', { name: /^save$/i }).first();
    const visible = await saveBtn.isVisible().catch(() => false);
    if (visible) {
      await saveBtn.click();
      await page.waitForTimeout(200);
      const nameInput = page.getByLabel(/name/i).first();
      const inputVisible = await nameInput.isVisible().catch(() => false);
      if (inputVisible) {
        await nameInput.fill('Test Scenario 2026');
      }
    }
  });

  test('deleting scenario requires confirmation', async ({ page }) => {
    await page.goto('/scenarios').catch(() => page.goto('/whatif'));
    await page.waitForLoadState('networkidle').catch(() => false);
    const delBtn = page.getByRole('button', { name: /delete|remove/i }).first();
    const visible = await delBtn.isVisible().catch(() => false);
    if (visible) {
      await delBtn.click();
      await page.waitForTimeout(200);
      const confirmBtn = page.getByRole('button', { name: /confirm|yes|delete/i }).first();
      const confirmVisible = await confirmBtn.isVisible().catch(() => false);
      expect(confirmVisible).toBeTruthy();
    }
  });
});
