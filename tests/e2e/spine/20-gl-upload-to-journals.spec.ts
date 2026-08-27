/**
 * SPINE JOURNEY B (wave 3, lane R22): GL upload → journal list shows the
 * imported rows, using the existing upload wizard DOM only:
 *   #file-input (FileDropZone) → auto-map (GLColumnMapper) →
 *   "Preview Data" → "Confirm & Import Data" (GLDataPreview) →
 *   /data/gl-journals tbody[data-testid="journals-tbody"].
 *
 * The fixture headers (account/date/debit/credit/description/reference) are
 * exactly the lowercase keys GLColumnMapper.autoDetect recognises, so the
 * required accountCode/postDate mappings fill automatically on mount.
 *
 * Authentication goes through the real mock-backend login UI — glStore's
 * write actions are RBAC-enforced ('ui:update'), so an authenticated session
 * is part of the journey, not scaffolding.
 */
import { test, expect } from '@playwright/test';
import { importGlJournalFixture, installSpineContext, signInAsAdmin } from '../_helpers/spine';

test.describe('Spine B: GL upload → journals', () => {
  test('upload wizard imports a balanced CSV and journals list the rows', async ({ page }) => {
    await installSpineContext(page);
    await signInAsAdmin(page);

    // Full wizard flow; returns after "Import Complete".
    await importGlJournalFixture(page);
    await expect(page.getByText(/Successfully imported \d+ rows/i)).toContainText('2');

    // Journals list reflects what was imported — real store rows.
    await page.goto('/data/gl-journals');
    const journalsBody = page.locator('[data-testid="journals-tbody"]');
    await expect(journalsBody).toBeVisible();
    await expect(journalsBody.locator('tr')).toHaveCount(2);
    await expect(journalsBody).toContainText('E2E upload cash receipt');
    await expect(journalsBody).toContainText('E2E upload sales revenue');

    // The empty-state import CTA must be gone now that entries exist.
    await expect(page.getByTestId('journals-empty-import')).toHaveCount(0);
  });
});
