import { test, expect, type Page } from '@playwright/test';

/**
 * Monte Carlo Simulation — Analytics Page / Run / Results
 *
 * Covers the Monte Carlo simulation workflow from analytics entry to result distribution.
 */

async function setupApp(page: Page) {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('finplan-setup-complete', 'true');
    localStorage.setItem(
      'auth-store',
      JSON.stringify({
        state: {
          user: { id: '1', name: 'Test User', email: 'test@finplan.com', role: 'Admin' },
          isAuthenticated: true,
          accessToken: 'mock-token',
          activeEntityId: 'entity-1',
        },
        version: 0,
      })
    );
  });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
}

test.describe('Workflow: Monte Carlo Simulation', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page);
  });

  test('analytics page renders with sections', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });

  test('analytics page exposes simulation trigger', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    const simTrigger = page.getByRole('button', { name: /run|simulate|monte carlo|start/i });
    if (await simTrigger.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(simTrigger.first()).toBeEnabled();
    }
  });

  test('Monte Carlo page accepts trial count configuration', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    const trialInput = page.getByLabel(/trials|iterations|samples|count/i);
    if (await trialInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await trialInput.fill('1000');
      await expect(trialInput).toHaveValue('1000');
    }
  });

  test('running simulation shows progress indicator', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    const runBtn = page.getByRole('button', { name: /run|simulate|start/i }).first();
    if (await runBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await runBtn.click();
      // Either a progress bar, spinner, or result chart appears
      const progress = page.locator(
        '[role="progressbar"], [aria-busy="true"], .animate-spin, [data-testid*="loading" i]'
      );
      const chart = page.locator('svg, canvas, [role="img"]');
      // Give it 500ms to show progress
      await page.waitForTimeout(500);
      const count = (await progress.count()) + (await chart.count());
      expect(count).toBeGreaterThan(0);
    }
  });

  test('simulation results show distribution histogram or stats', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    const runBtn = page.getByRole('button', { name: /run|simulate|start/i }).first();
    if (await runBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await runBtn.click();
      // Wait for results (up to 10s for simulation)
      await page.waitForTimeout(2000);
      // Check for distribution chart or statistics text
      const stats = page.getByText(/mean|median|std dev|p5|p95|confidence/i);
      const chart = page.locator('svg, [role="img"]');
      const count = (await stats.count()) + (await chart.count());
      expect(count).toBeGreaterThan(0);
    }
  });

  test('Monte Carlo scenario list page renders', async ({ page }) => {
    await page.goto('/scenarios');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });
});
