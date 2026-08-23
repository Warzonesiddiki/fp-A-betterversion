/**
 * SPINE JOURNEY C (wave 3, lane R22): the report page renders from the
 * SEEDED glStore.
 *
 * SEEDING MECHANISM (documented deviation): the brief asked for glStore
 * seeding "via localStorage injection before load", but every
 * masterStorage-backed store persists AES-GCM-ENCRYPTED through chunked
 * storage (ADR-005/007, src/utils/masterStorage.ts) — plain-text injection
 * cannot hydrate and replicating the device-key crypto in tests would couple
 * E2E specs to security internals. The equivalent — and stronger — seed is
 * the product's own import path: Journey B's upload wizard writes the two
 * balanced rows through glStore.importGLData into the REAL encrypted store,
 * then this spec performs a FULL PAGE RELOAD, forcing a genuine
 * persist-hydration round-trip, before rendering the Trial Balance from it.
 *
 * Two balanced rows (debit 1500 / credit 1500) must produce a BALANCED
 * Trial Balance with both accounts listed — a K18-flavoured end-to-end pin:
 * wrong arithmetic cannot render the green banner.
 */
import { test, expect } from '@playwright/test';
import { importGlJournalFixture, installSpineContext, signInAsAdmin } from '../_helpers/spine';

test.describe('Spine C: report renders from seeded glStore', () => {
  test('trial balance generates balanced totals after a full reload', async ({ page }) => {
    await installSpineContext(page);
    await signInAsAdmin(page);

    // Seed the real encrypted glStore through the product's own import flow…
    await importGlJournalFixture(page);
    // …then prove persistence: full reload discards all in-memory state; the
    // report must rebuild from hydrated persisted entries alone.
    await page.reload();

    await page.goto('/data/gl-trial-balance');

    // Hydration is asynchronous: wait for either the not-generated state or
    // an already-generated table. The empty branch must NOT be the settled
    // state now that persisted entries exist.
    const generateButton = page.getByRole('button', { name: /generate trial balance/i });
    const balancedBanner = page.getByText(/Trial Balance is Balanced/i);
    await expect(generateButton.or(balancedBanner)).toBeVisible({ timeout: 30_000 });
    if (await generateButton.isVisible()) {
      await generateButton.click();
    }

    // Balanced banner: debits == credits from the two seeded rows.
    await expect(balancedBanner).toBeVisible({ timeout: 30_000 });

    // Both seeded accounts appear in the report body. Note: GLUploadPage
    // derives accountName from the mapped account column (GLUploadPage.tsx
    // L272), so imported rows carry the CODE as their display name.
    const reportBody = page.locator('tbody').first();
    await expect(reportBody).toBeVisible();
    await expect(reportBody).toContainText('1001');
    await expect(reportBody).toContainText('4000');
    await expect(reportBody).toContainText('$1,500');
    await expect(page.getByText(/\b2 entries\b/)).toBeVisible();
  });
});
