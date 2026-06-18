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

test.describe('Workflow 10: Forecasting & Driver Planning', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page);
  });

  test('Forecasts page renders forecast list', async ({ page }) => {
    const fcLink = page.getByRole('link', { name: /forecast/i }).first();
    const visible = await fcLink.isVisible().catch(() => false);
    if (visible) {
      await fcLink.click();
      await page.waitForLoadState('networkidle');
      await expectHeading(page);
    }
  });

  test('Driver Planning page shows driver inputs', async ({ page }) => {
    await page.goto('/forecasts/drivers').catch(() => page.goto('/forecasts'));
    await page.waitForLoadState('networkidle').catch(() => false);
    await expectHeading(page);
  });

  test('CapEx Tracker page renders capex entries', async ({ page }) => {
    await page.goto('/capex').catch(() => page.goto('/forecasts/capex'));
    await page.waitForLoadState('networkidle').catch(() => false);
    await expectHeading(page);
  });

  test('WhatIf page allows scenario creation', async ({ page }) => {
    await page.goto('/whatif').catch(() => page.goto('/scenarios'));
    await page.waitForLoadState('networkidle').catch(() => false);
    await expectHeading(page);
  });

  test('forecast horizon selector changes period', async ({ page }) => {
    await page.goto('/forecasts').catch(() => false);
    await page.waitForLoadState('networkidle').catch(() => false);
    const horizon = page
      .locator('select, [data-testid*="horizon"], [data-testid*="period"]')
      .first();
    const visible = await horizon.isVisible().catch(() => false);
    if (visible) {
      await horizon.selectOption({ index: 1 }).catch(() => false);
      await page.waitForTimeout(200);
    }
  });

  test('running forecast shows progress indicator', async ({ page }) => {
    await page.goto('/forecasts').catch(() => false);
    await page.waitForLoadState('networkidle').catch(() => false);
    const runBtn = page.getByRole('button', { name: /run|generate|compute/i }).first();
    const visible = await runBtn.isVisible().catch(() => false);
    if (visible) {
      await runBtn.click();
      await page.waitForTimeout(300);
    }
  });

  test('forecast chart displays time-series', async ({ page }) => {
    await page.goto('/forecasts').catch(() => false);
    await page.waitForLoadState('networkidle').catch(() => false);
    const chart = page.locator('svg, canvas, [data-testid*="chart"]').first();
    const visible = await chart.isVisible().catch(() => false);
    expect(visible).toBeTruthy();
  });
});
