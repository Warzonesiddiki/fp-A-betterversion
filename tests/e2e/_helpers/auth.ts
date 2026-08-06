/**
 * Common E2E authentication helper for Playwright journey tests.
 */
import { type Page } from '@playwright/test';

export async function signInAsCfo(page: Page): Promise<void> {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('finplan-setup-complete', 'true');
    localStorage.setItem(
      'auth-store',
      JSON.stringify({
        state: {
          user: {
            id: 'cfo-user',
            name: 'Sarah Chen',
            email: 'cfo@finplanpro.com',
            role: 'CFO',
            permissions: ['*'],
          },
          isAuthenticated: true,
          accessToken: 'mock-cfo-token',
          activeEntityId: 'entity-1',
        },
        version: 1,
      })
    );
  });
  await page.goto('/');
}
