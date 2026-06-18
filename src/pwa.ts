/// <reference types="vite-plugin-pwa/client" />
// ^^ Provides `virtual:pwa-register` module types for vite-plugin-pwa.

import { registerSW } from 'virtual:pwa-register';

/**
 * Register the FinPlan Pro service worker (vite-plugin-pwa).
 *
 * PATH A PATCH 7 PART 1 (cycle 25 turn 346+, Prometheus).
 *
 * Behaviour:
 *  - No-op in non-browser environments (SSR / Node tests).
 *  - No-op on browsers without ServiceWorker support.
 *  - Logs registration success / errors to the console.
 *
 * @example
 *   import { registerPWA } from '@/pwa';
 *   registerPWA();
 */
export function registerPWA(): void {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }
  registerSW({
    immediate: true,
    onRegisteredSW(swScriptUrl: string) {
      console.info('[PWA] Service worker registered:', swScriptUrl);
    },
    onRegisterError(error: unknown) {
      console.error('[PWA] Service worker registration failed:', error);
    },
  });
}
