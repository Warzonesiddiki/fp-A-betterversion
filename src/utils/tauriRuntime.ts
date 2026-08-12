/**
 * Tauri runtime detection (desktop-only product gate).
 *
 * FinPlan Pro is a desktop app. Since 2026-08-12 (owner decision) the F-05
 * browser beta channel has been removed: the app renders only inside the
 * Tauri shell, and a plain browser is blocked with an alert + null render
 * (see src/App.tsx). This module is the single source of truth for the
 * runtime check; uiStore also uses it to guard the lazy `@tauri-apps`
 * plugin imports, which must never be evaluated in a non-Tauri runtime
 * (including the jsdom test environment).
 */

export function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}
