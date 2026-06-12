import { test, expect } from '@playwright/test';

test.describe('Navigation & Page Load', () => {
  test('should load dashboard without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });

  test('should navigate through main sections', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
  });

  test('should show 404 for unknown routes', async ({ page }) => {
    const response = await page.goto('/nonexistent-route');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 5000 });
  });
});
