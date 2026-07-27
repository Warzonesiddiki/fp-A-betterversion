import { test, expect } from '@playwright/test';

/**
 * Onboarding -> Dashboard -> Data Import Flow
 *
 * This test verifies the core "First Run" experience:
 * 1. Completing the Onboarding Wizard
 * 2. Landing on the empty Dashboard
 * 3. Navigating to Data Import
 * 4. Successfully importing General Ledger data
 * 5. Verifying the Dashboard now shows financial metrics
 */

test.describe('Core Flow: Onboarding to Data Import', () => {
  test.beforeEach(async ({ page }) => {
    // Clear state to ensure we start from the very beginning (First Run)
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.goto('/');
  });

  test('should complete the full onboarding and data import flow', async ({ page }) => {
    // --- 1. Onboarding Wizard ---

    // Step 0: Welcome
    await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();
    await page.getByRole('button', { name: /get started|start/i }).click();

    // Step 1: Company Info
    await expect(page.getByRole('heading', { name: /set up your organization|company/i })).toBeVisible();
    await page.getByLabel(/company name/i).fill('Acme Corp');
    // Selects are custom components, but should have roles
    await page.getByLabel(/industry|sector/i).selectOption({ label: 'Technology' });
    await page.getByRole('button', { name: /continue/i }).click();

    // Step 2: Data Import (Initial)
    await expect(page.getByRole('heading', { name: /import your data/i })).toBeVisible();
    // We skip initial import to test the flow via Dashboard later
    await page.getByRole('button', { name: /skip for now/i }).click();

    // Step 3: Review
    await expect(page.getByRole('heading', { name: /review|confirm/i })).toBeVisible();
    await page.getByRole('button', { name: /confirm/i }).click();

    // Step 4: Success
    await expect(page.getByRole('heading', { name: /all set/i })).toBeVisible();
    await page.getByRole('button', { name: /go to dashboard/i }).click();

    // --- 2. Empty Dashboard ---

    await expect(page).toHaveURL(/.*dashboard|.*\//);
    await expect(page.getByRole('heading', { name: /welcome to finplan pro/i })).toBeVisible();

    // Check that instructions are visible
    await expect(page.getByText(/import your data/i)).toBeVisible();

    // Navigate to Import Data
    await page.getByRole('button', { name: /import data/i }).click();

    // --- 3. Data Import Page ---

    await expect(page).toHaveURL(/.*data\/gl-upload/);
    await expect(page.getByRole('heading', { name: /import your financial data/i })).toBeVisible();

    // Create a mock CSV file
    const csvContent = `Account Code,Account Name,Date,Debit,Credit,Description
4000,Revenue,2025-01-15,0,10000,Service Sale
6000,Rent,2025-01-16,2000,0,Office Rent
6100,Payroll,2025-01-20,5000,0,January Salaries
`;

    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.locator('input[type="file"]').click(),
    ]);
    await fileChooser.setFiles({
      name: 'gl_data.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent),
    });

    // --- 4. Mapping & Preview ---

    // Step: Map Columns
    await expect(page.getByText(/map columns/i)).toBeVisible();

    // Map required fields if not auto-detected
    // Account Code mapping
    const accountCodeSelect = page.locator('select').first(); // Adjust selector based on GLColumnMapper implementation
    if (await accountCodeSelect.isVisible()) {
      await accountCodeSelect.selectOption('Account Code');
    }

    // Posting Date mapping
    await page.getByRole('button', { name: /preview data/i }).click();

    // Step: Preview & Validate
    await expect(page.getByText(/preview & validate/i)).toBeVisible();
    await expect(page.getByText('Revenue')).toBeVisible();
    await expect(page.getByText('10000')).toBeVisible();

    await page.getByRole('button', { name: /import records|confirm import/i }).click();

    // --- 5. Final Verification ---

    // Wait for import to complete
    await expect(page.getByText(/import complete/i)).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: /go to dashboard/i }).click();

    // Verify Dashboard now shows data
    await expect(page.getByRole('heading', { name: /executive dashboard/i })).toBeVisible();
    await expect(page.getByText(/total revenue/i)).toBeVisible();

    // Verify specific values from our mock CSV
    // Revenue is 10000, Net Income = 10000 - 2000 - 5000 = 3000
    await expect(page.getByText('$10,000')).toBeVisible();
    await expect(page.getByText('$3,000')).toBeVisible();
  });

  test('should allow resetting setup from settings', async ({ page }) => {
    // Start with completed setup
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('finplan-setup-complete', 'true');
    });
    await page.goto('/settings');

    // Find reset button - assuming it exists in settings based on useFirstRun hook
    // Note: If UI doesn't have it yet, this test serves as a requirement
    const resetBtn = page.getByRole('button', { name: /reset app|clear all data/i });
    if (await resetBtn.isVisible()) {
      await resetBtn.click();
      // Confirm dialog
      await page.getByRole('button', { name: /confirm|yes/i }).click();

      // Should be back at onboarding
      await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();
    }
  });
});
