/**
 * Beta-mode gate (F-05, solo-dev validation enabler).
 *
 * The application is Tauri-first by design. Browser rendering is allowed ONLY
 * when explicitly enabled via `VITE_BETA_WEB=true|1` — this creates the public
 * beta channel required by the solo-dev evidence strategy (validation-plan
 * v2.2, Tier 2 BETA-USAGE) WITHOUT silently broadening the supported runtime.
 *
 * Enabling beta mode is NOT a claim that browser/PWA is a supported product
 * capability (A-12 remains UNVALIDATED).
 */

export function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export function isBrowserBetaAllowed(env: ImportMetaEnv = import.meta.env): boolean {
  return env.VITE_BETA_WEB === 'true' || env.VITE_BETA_WEB === '1';
}

/** True when the app may render in the current runtime. */
export function isRenderAllowed(env: ImportMetaEnv = import.meta.env): boolean {
  return isTauriRuntime() || isBrowserBetaAllowed(env);
}
