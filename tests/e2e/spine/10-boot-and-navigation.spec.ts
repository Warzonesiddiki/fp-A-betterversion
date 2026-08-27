/**
 * SPINE JOURNEY A (wave 3, lane R22): the app boots past the desktop-only
 * Tauri gate and primary navigation renders. The pillar nav is the product's
 * top-level navigation (data-testid="pillar-nav", pillars plan / analyze /
 * report / model / admin — see src/components/layout/PillarNav.tsx); this
 * journey boots into the dashboard hub, then follows the Report pillar to
 * /reports. It also pins that the gate text never renders.
 */
import { test, expect } from '@playwright/test';
import { installSpineContext } from '../_helpers/spine';

test.describe('Spine A: boot + primary navigation', () => {
  test('app boots to the dashboard hub with the pillar nav mounted', async ({ page }) => {
    await installSpineContext(page);
    await page.goto('/dashboard');

    // The Tauri gate must stay silent: no block alert copy anywhere, and the
    // shell actually rendered. First paint can sit on the app's LoadingScreen
    // while useFirstRun resolves storage asynchronously — allow for it.
    await expect(page.getByText(/exclusively as a desktop app/i)).toHaveCount(0);
    await expect(page.getByTestId('pillar-nav')).toBeVisible({ timeout: 45_000 });

    // All five pillars mount; Plan is the active hub on /dashboard.
    for (const pillar of ['plan', 'analyze', 'report', 'model', 'admin']) {
      await expect(page.getByTestId(`pillar-${pillar}`)).toBeVisible({ timeout: 15_000 });
    }
  });

  test('primary navigation: Report pillar leads to the reports list', async ({ page }) => {
    await installSpineContext(page);
    await page.goto('/dashboard');
    await expect(page.getByTestId('pillar-report')).toBeVisible();
    await page.getByTestId('pillar-report').click();

    await expect(page).toHaveURL(/\/reports$/);
    // ReportsListPage renders its honest empty state when no reports exist;
    // either way the main region must show reports content.
    await expect(
      page
        .getByRole('main')
        .getByText(/no data available|report/i, { exact: false })
        .first()
    ).toBeVisible({ timeout: 30_000 });
    // Navigation did not fall off the shell: pillar nav still mounted.
    await expect(page.getByTestId('pillar-nav')).toBeVisible();
  });
});
