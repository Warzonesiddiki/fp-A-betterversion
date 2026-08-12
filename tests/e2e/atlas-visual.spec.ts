import { test, expect, type Page } from '@playwright/test';
import { createHash } from 'node:crypto';

/**
 * Atlas visual-regression baselines — BMAD Story F-02.
 *
 * Executes docs/design/VISUAL_REGRESSION_RUNBOOK.md in a real browser:
 *   1. FinancialStatusBadge — all ten lifecycle states, dark + light
 *   2. PageHeader — full anatomy + minimal variant, wide + compact
 *   3. FinancialWorkspaceEmptyState — canonical setup state, dark + light
 *   4. Dashboard empty workspace — 1440px desktop + 390px compact
 *   5. Dashboard populated workspace — local-draft trust status, 1440px + 1024px (dark) and 1440px (light)
 *
 * Determinism discipline (runbook):
 *   - fixed viewport, UTC timezone, en-US locale, fixed device scale factor
 *   - reduced-motion emulation + injected animation kill-switch
 *   - deterministic seeded fixture data (no dates, no randomness, no live APIs)
 *   - populated state is restored through the app's OWN canonical backup path
 *     (BackupRestore.importBackup, SHA-256-verified JSON) — never by patching
 *     component internals
 *
 * Tauri shim (runbook): `__TAURI_INTERNALS__` satisfies the desktop-only App
 * gate while the storage layer checks `__TAURI_INTERNALS` (no trailing __), so
 * a plain browser renders the app AND persists through the browser SQL.js
 * backend. This is a test-only shim — it must never relax production policy.
 */

const COLUMN_MAPPING = [
  { sourceColumn: '', targetField: 'date', isRequired: true },
  { sourceColumn: '', targetField: 'accountCode', isRequired: true },
  { sourceColumn: '', targetField: 'debit', isRequired: false },
  { sourceColumn: '', targetField: 'credit', isRequired: false },
  { sourceColumn: '', targetField: 'description', isRequired: false },
  { sourceColumn: '', targetField: 'reference', isRequired: false },
];

/** Mirrors src/pages/DashboardPage.populated.contract.test.tsx fixture (fixed periods, no randomness). */
const GL_ENTRIES = [
  {
    id: 'e1',
    accountId: '4000',
    accountCode: '4000',
    accountName: 'Revenue',
    period: '2026-01',
    periodName: '2026-01',
    debit: 0,
    credit: 100000,
    netChange: -100000,
    amount: -100000,
    date: '2026-01-15',
    description: '',
    reference: '',
  },
  {
    id: 'e2',
    accountId: '4000',
    accountCode: '4000',
    accountName: 'Revenue',
    period: '2026-02',
    periodName: '2026-02',
    debit: 0,
    credit: 120000,
    netChange: -120000,
    amount: -120000,
    date: '2026-02-15',
    description: '',
    reference: '',
  },
  {
    id: 'e3',
    accountId: '5000',
    accountCode: '5000',
    accountName: 'Salaries Expense',
    period: '2026-01',
    periodName: '2026-01',
    debit: 60000,
    credit: 0,
    netChange: 60000,
    amount: 60000,
    date: '2026-01-15',
    description: '',
    reference: '',
  },
  {
    id: 'e4',
    accountId: '6000',
    accountCode: '6000',
    accountName: 'Operating Expense',
    period: '2026-01',
    periodName: '2026-01',
    debit: 20000,
    credit: 0,
    netChange: 20000,
    amount: 20000,
    date: '2026-01-15',
    description: '',
    reference: '',
  },
];

const BACKUP_FORMAT_VERSION = 2;

/** Byte-identical re-implementation of src/utils/backupRestore.ts canonicalJSON. */
function canonicalJSON(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(canonicalJSON).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${JSON.stringify(k)}:${canonicalJSON(v)}`);
  return `{${entries.join(',')}}`;
}

function sha256(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

function buildBackupJson(theme: 'dark' | 'light'): string {
  const data: Record<string, unknown> = {
    'gl-store': {
      state: { entries: GL_ENTRIES, importHistory: [], columnMapping: COLUMN_MAPPING },
      version: 1,
    },
    'ui-store': {
      state: {
        sidebarCollapsed: false,
        theme,
        globalDateRange: { start: '2024-01-01', end: '2024-12-31' },
      },
      version: 1,
    },
  };
  const storeSizes: Record<string, number> = {};
  for (const [key, value] of Object.entries(data)) storeSizes[key] = canonicalJSON(value).length;
  const checksum = sha256(canonicalJSON(data));
  const backup = {
    metadata: {
      formatVersion: BACKUP_FORMAT_VERSION,
      appVersion: '1.0.0',
      exportedAt: '2026-01-01T00:00:00.000Z',
      storeSizes,
      checksum,
    },
    data,
  };
  return JSON.stringify(backup, null, 2);
}

const TAURI_SHIM = () => {
  Object.defineProperty(window, '__TAURI_INTERNALS__', { value: {}, configurable: true });
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
  // Determinism: kill animation/transition timing in the test browser.
  const style = document.createElement('style');
  style.textContent =
    '*,*::before,*::after{animation-duration:0.001ms!important;transition-duration:0.001ms!important;animation-iteration-count:1!important}';
  document.head.appendChild(style);
};

async function bootApp(page: Page, opts: { withData?: boolean; theme?: 'dark' | 'light' } = {}) {
  await page.addInitScript(TAURI_SHIM);
  await page.emulateMedia({ colorScheme: opts.theme ?? 'dark', reducedMotion: 'reduce' });
  await page.goto('/');
  if (opts.withData) {
    await page.goto('/settings/backup');
    const input = page.locator('input[type="file"]');
    await input.setInputFiles({
      name: 'atlas-baseline.json',
      mimeType: 'application/json',
      buffer: Buffer.from(buildBackupJson(opts.theme ?? 'dark')),
    });
    // The page auto-reloads ~1.5s after a successful restore (BackupRestorePage).
    await expect(page.getByRole('alert')).toContainText('Backup restored successfully', {
      timeout: 15000,
    });
    await page.waitForURL('**/settings/backup**').catch(() => undefined);
    await page.goto('/');
  }
}

test.describe('Atlas visual baselines (F-02 runbook)', () => {
  test.use({ locale: 'en-US', timezoneId: 'UTC' });

  test('FinancialStatusBadge: all ten lifecycle states, dark + light', async ({ page }) => {
    await bootApp(page, { theme: 'dark' });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/visual/atlas');
    const section = page.locator('[data-testid="badge-baseline"]');
    await expect(section.getByRole('status')).toHaveCount(10);
    await expect(section.getByRole('status').first()).toContainText('Draft');
    await expect(section).toHaveScreenshot('atlas-badge-dark.png');

    await bootApp(page, { theme: 'light' });
    await page.goto('/visual/atlas');
    await expect(page.locator('[data-testid="badge-baseline"]').getByRole('status')).toHaveCount(
      10
    );
    await expect(page.locator('[data-testid="badge-baseline"]')).toHaveScreenshot(
      'atlas-badge-light.png'
    );
  });

  test('PageHeader: full anatomy + minimal variant, wide + compact', async ({ page }) => {
    await bootApp(page, { theme: 'dark' });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/visual/atlas');
    const section = page.locator('[data-testid="pageheader-baseline"]');
    await expect(section.getByRole('heading', { name: 'Executive Dashboard' })).toBeVisible();
    await expect(section.getByRole('heading', { name: 'Chart of Accounts' })).toBeVisible();
    await expect(section).toHaveScreenshot('atlas-pageheader-dark-wide.png');

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(section).toHaveScreenshot('atlas-pageheader-dark-compact.png');
  });

  test('FinancialWorkspaceEmptyState: canonical setup state, dark + light', async ({ page }) => {
    await bootApp(page, { theme: 'dark' });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/visual/atlas');
    const section = page.locator('[data-testid="emptystate-baseline"]');
    await expect(
      section.getByRole('heading', { name: 'Set up your finance workspace' })
    ).toBeVisible();
    await expect(section.getByLabel('Setup steps').locator('li')).toHaveCount(3);
    await expect(section).toHaveScreenshot('atlas-emptystate-dark.png');

    await bootApp(page, { theme: 'light' });
    await page.goto('/visual/atlas');
    await expect(page.locator('[data-testid="emptystate-baseline"]')).toHaveScreenshot(
      'atlas-emptystate-light.png'
    );
  });

  test('Dashboard empty workspace: 1440px desktop + 390px compact (dark default)', async ({
    page,
  }) => {
    await bootApp(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/dashboard');
    await expect(
      page.getByRole('heading', { name: 'Set up your finance workspace' })
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Import actuals' })).toBeVisible();
    await expect(page).toHaveScreenshot('atlas-dashboard-empty-1440.png', { fullPage: true });

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(
      page.getByRole('heading', { name: 'Set up your finance workspace' })
    ).toBeVisible();
    await expect(page).toHaveScreenshot('atlas-dashboard-empty-390.png', { fullPage: true });
  });

  test('Dashboard populated workspace: draft trust status at 1440px + 1024px (dark) and 1440px (light)', async ({
    page,
  }) => {
    await bootApp(page, { withData: true, theme: 'dark' });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Executive Dashboard' })).toBeVisible();
    await expect(
      page.getByRole('main').getByRole('status', { name: /Draft/ })
    ).toContainText('Draft');
    await expect(page.getByText('Total Revenue')).toBeVisible();
    await expect(page).toHaveScreenshot('atlas-dashboard-populated-1440-dark.png');

    await page.setViewportSize({ width: 1024, height: 768 });
    await expect(page.getByRole('heading', { name: 'Executive Dashboard' })).toBeVisible();
    await expect(
      page.getByRole('main').getByRole('status', { name: /Draft/ })
    ).toContainText('Draft');
    await expect(page).toHaveScreenshot('atlas-dashboard-populated-1024-dark.png');

    await bootApp(page, { withData: true, theme: 'light' });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Executive Dashboard' })).toBeVisible();
    await expect(
      page.getByRole('main').getByRole('status', { name: /Draft/ })
    ).toContainText('Draft');
    await expect(page).toHaveScreenshot('atlas-dashboard-populated-1440-light.png');
  });
});
