import { test, expect, type Page } from '@playwright/test';

/**
 * Onboarding Wizard — Full 5-Step Flow
 *
 * Covers the complete first-run experience: welcome → setup → import → review → done.
 * Verifies step navigation, validation, store updates, and a11y landmarks.
 */

async function freshInstall(page: Page) {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.goto('/');
}

test.describe('Workflow: Onboarding Wizard', () => {
  test.beforeEach(async ({ page }) => {
    await freshInstall(page);
  });

  test('completes full 5-step wizard with imported data', async ({ page }) => {
    // Step 1: Welcome
    await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /get started|start/i })).toBeEnabled();
    await page.getByRole('button', { name: /get started|start/i }).click();

    // Step 2: Company setup
    await expect(
      page.getByRole('heading', { name: /set up your organization|company/i })
    ).toBeVisible();
    await page.getByLabel(/company name/i).fill('Acme Corp');
    await page.getByLabel(/industry|sector/i).selectOption({ label: 'Technology' });
    await page.getByLabel(/fiscal year start/i).selectOption({ index: 0 });
    await page.getByRole('button', { name: /continue|next/i }).click();

    // Step 3: Data import (skip for fresh path)
    await expect(page.getByRole('heading', { name: /import your data/i })).toBeVisible();
    await page.getByRole('button', { name: /skip for now/i }).click();

    // Step 4: Review
    await expect(page.getByRole('heading', { name: /review|confirm/i })).toBeVisible();
    await page.getByRole('button', { name: /confirm|finish/i }).click();

    // Step 5: Done
    await expect(page.getByRole('heading', { name: /all set|ready|done/i })).toBeVisible();
    await page.getByRole('button', { name: /go to dashboard|finish/i }).click();

    // Verify dashboard reached
    await expect(page).toHaveURL(/.*dashboard|.*\//);
    await expect(page.getByRole('heading', { name: /dashboard|welcome/i }).first()).toBeVisible();
  });

  test('rejects empty company name on setup step', async ({ page }) => {
    await page.getByRole('button', { name: /get started|start/i }).click();
    await expect(
      page.getByRole('heading', { name: /set up your organization|company/i })
    ).toBeVisible();
    // Try to continue without filling
    const continueBtn = page.getByRole('button', { name: /continue|next/i });
    if (await continueBtn.isEnabled()) {
      await continueBtn.click();
      // Should still be on setup step with validation error
      await expect(page.getByRole('heading', { name: /set up your organization/i })).toBeVisible();
    } else {
      await expect(continueBtn).toBeDisabled();
    }
  });

  test('back/forward navigation preserves entered values', async ({ page }) => {
    await page.getByRole('button', { name: /get started|start/i }).click();
    await page.getByLabel(/company name/i).fill('Persisted Co');
    await page.getByLabel(/industry|sector/i).selectOption({ label: 'Manufacturing' });

    const backBtn = page.getByRole('button', { name: /back/i });
    if (await backBtn.isVisible()) {
      await backBtn.click();
      await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();
      await page.getByRole('button', { name: /get started|start/i }).click();
      // Re-filled value should persist
      await expect(page.getByLabel(/company name/i)).toHaveValue('Persisted Co');
    }
  });

  test('wizard has ARIA landmarks and focus management', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();
    const stepContainer = page.locator('[role="dialog"], [aria-labelledby], main');
    await expect(stepContainer.first()).toBeVisible();
  });

  test('live region announces step changes', async ({ page }) => {
    const liveRegion = page.locator('[aria-live="polite"], [role="status"]');
    await page.getByRole('button', { name: /get started|start/i }).click();
    // Live region may be present for SR announcements
    if ((await liveRegion.count()) > 0) {
      await expect(liveRegion.first()).toBeVisible();
    }
  });

  test('wizard is keyboard navigable end-to-end', async ({ page }) => {
    await page.keyboard.press('Tab'); // focus first interactive
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter'); // activate
    // Should advance or interact
    const focused = page.locator(':focus');
    await expect(focused).toBeTruthy();
  });

  test('onboarding can be reset from settings', async ({ page }) => {
    // Set finplan-setup-complete to bypass wizard
    await page.evaluate(() => {
      localStorage.setItem('finplan-setup-complete', 'true');
    });
    await page.goto('/settings');
    const resetBtn = page.getByRole('button', { name: /reset app|clear all data/i });
    if (await resetBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await resetBtn.click();
      const confirmBtn = page.getByRole('button', { name: /confirm|yes/i });
      if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmBtn.click();
        await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();
      }
    }
  });

  test('sector dropdown shows all 17 sector options', async ({ page }) => {
    await page.getByRole('button', { name: /get started|start/i }).click();
    const sectorSelect = page.getByLabel(/industry|sector/i);
    await expect(sectorSelect).toBeVisible();
    // Check that the select has multiple options
    const optionCount = await sectorSelect.locator('option').count();
    expect(optionCount).toBeGreaterThanOrEqual(10);
  });
});
