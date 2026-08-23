/**
 * Shared helpers for the wave-3 product-spine E2E specs (lane R22).
 *
 * TAURI GATE BYPASS — the app blocks plain browsers unconditionally
 * (src/App.tsx evaluates `isTauriRuntime()` per render and alerts + renders
 * null). The single source of truth for that check is
 * `'__TAURI_INTERNALS__' in window` (src/utils/tauriRuntime.ts), so these
 * helpers install a minimal `__TAURI_INTERNALS__` shim via addInitScript
 * BEFORE any app script runs. The shim answers IPC invokes with null so the
 * lazily-imported @tauri-apps plugins resolve without crashing their effect
 * chains; nothing on the product spine depends on real IPC results.
 *
 * AUTHENTICATION — every masterStorage-backed store (authStore included,
 * src/store/authStore.ts L757-758) persists AES-GCM-encrypted through
 * masterStorage (ADR-005/007), so PLAIN-TEXT localStorage injection cannot
 * seed them (the legacy tests/e2e/_helpers/auth.ts helper predates
 * encryption-at-rest and no longer hydrates). Authentication therefore goes
 * through the REAL /login UI against VITE_USE_MOCK_AUTH=true (enabled for
 * the Playwright dev server in playwright.config.ts webServer.env, mirroring
 * vitest's env block in vite.config.ts). `admin@finplan.com` is MOCK_USERS'
 * Admin identity (full ROLE_PERMISSIONS.Admin — covers ui:update, gl:*);
 * mock auth accepts ANY password.
 *
 * FIRST-RUN — `finplan-setup-complete` is read from PLAIN localStorage
 * (src/hooks/useFirstRun.ts L12), so it IS injected as plain text.
 */
import { expect, type Locator, type Page } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TAURI_SHIM = `
  window.__TAURI_INTERNALS__ = {
    isTauri: true,
    metadata: {
      currentWebview: { label: 'e2e-spine' },
      currentWindow: { label: 'e2e-spine' },
    },
    plugins: {},
    transformCallback: (cb) => {
      const id = Math.floor(Math.random() * 2 ** 31);
      window['_' + id] = cb;
      return id;
    },
    invoke: async () => null,
  };
  localStorage.setItem('finplan-setup-complete', 'true');
`;

/** Install the Tauri-runtime shim + first-run-done flag before app scripts run. */
export async function installSpineContext(page: Page): Promise<void> {
  await page.addInitScript(TAURI_SHIM);
}

/**
 * Authenticate through the real login UI (mock backend). Must run after
 * installSpineContext. Leaves the browser signed in as Admin on /dashboard.
 */
export async function signInAsAdmin(page: Page): Promise<void> {
  await page.goto('/login');
  // #login-email / #login-password: getByLabel('Email') also matches the
  // "Remember my email" checkbox.
  await page.locator('#login-email').fill('admin@finplan.com');
  await page.locator('#login-password').fill('E2e-Spine-2026!');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/dashboard/, { timeout: 30_000 });
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/** Balanced two-row GL fixture whose headers GLColumnMapper.autoDetect recognises. */
export const GL_JOURNAL_CSV = path.join(__dirname, '..', 'fixtures', 'gl-journal-e2e.csv');

async function expectVisible(locator: Locator, timeout = 15_000): Promise<void> {
  await expect(locator).toBeVisible({ timeout });
}

async function expectEnabled(locator: Locator, timeout = 15_000): Promise<void> {
  await expect(locator).toBeEnabled({ timeout });
}

/**
 * Import tests/e2e/fixtures/gl-journal-e2e.csv through the REAL upload
 * wizard: drop zone → auto-mapped column mapper → preview → confirm →
 * completion screen. Leaves entries persisted in glStore.
 */
export async function importGlJournalFixture(page: Page): Promise<void> {
  await page.goto('/data/gl-upload');
  await expectVisible(page.getByText(/Import Your Financial Data/i));

  // The financial-context bar performs a one-time ?currency=… URL sync once
  // stores hydrate; a replace-navigation here would remount the wizard and
  // reset it to step 0 mid-flow. Let the URL settle before uploading.
  await page.waitForURL(/currency=/, { timeout: 5_000 }).catch(() => {});
  await expectVisible(page.getByText(/Import Your Financial Data/i));

  await page.locator('#file-input').setInputFiles(GL_JOURNAL_CSV);

  // Step 1 — mapper appears once parsing completes (auto-retrying). If a
  // late financial-context navigation remounted the wizard back to step 0,
  // re-offer the file exactly once.
  const mapper = page.locator('[aria-label="GLColumnMapper"]');
  try {
    await expectVisible(mapper);
  } catch {
    await page.locator('#file-input').setInputFiles(GL_JOURNAL_CSV);
    await expectVisible(mapper);
  }

  const previewButton = page.getByRole('button', { name: /preview data/i });
  await expectEnabled(previewButton);
  await previewButton.click();

  // Step 2 — preview validates both rows; confirm imports them.
  const confirmButton = page.getByRole('button', { name: /confirm & import data/i });
  await expectVisible(confirmButton);
  await expectEnabled(confirmButton);
  await confirmButton.click();

  // Step 4 — completion screen reports the imported row count.
  await expectVisible(page.getByText(/Import Complete/i), 30_000);
}
