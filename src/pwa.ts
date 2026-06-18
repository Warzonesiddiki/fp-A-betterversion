/**
 * PWA Lifecycle — service worker registration, install/update prompt
 */
import { createLogger } from '@/utils/logger';

const pwaLogger = createLogger('PWA');

let installPromptEvent: BeforeInstallPromptEvent | null = null;
let updateAvailable = false;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Register the service worker (vite-plugin-pwa generates /sw.js).
 * Fires 'app:pwa-updated' event when a new SW is waiting.
 */
export async function registerSW(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) {
    pwaLogger.warn('Service workers not supported in this environment');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    registration.addEventListener('updatefound', () => {
      const installing = registration.installing;
      if (!installing) return;

      installing.addEventListener('statechange', () => {
        if (installing.state === 'installed' && navigator.serviceWorker.controller) {
          updateAvailable = true;
          window.dispatchEvent(new CustomEvent('app:pwa-updated'));
          pwaLogger.info('New version installed — refresh to update');
        }
      });
    });
  } catch (err) {
    pwaLogger.error('SW registration failed', {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Capture the install prompt so we can show our own UI.
 * @see https://developer.mozilla.org/en-US/docs/Web/Manifest
 */
export function setupInstallPrompt(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installPromptEvent = e as BeforeInstallPromptEvent;
    window.dispatchEvent(new CustomEvent('app:pwa-installable'));
  });

  window.addEventListener('appinstalled', () => {
    installPromptEvent = null;
    window.dispatchEvent(new CustomEvent('app:pwa-installed'));
  });
}

/**
 * Show the install prompt.
 * @returns true if the user accepted, false otherwise
 */
export async function promptInstall(): Promise<boolean> {
  if (!installPromptEvent) return false;
  await installPromptEvent.prompt();
  const choice = await installPromptEvent.userChoice;
  return choice.outcome === 'accepted';
}

/**
 * Check if a SW update is available.
 */
export function isUpdateAvailable(): boolean {
  return updateAvailable;
}

/**
 * Force activation of waiting SW and reload.
 */
export async function applyUpdate(): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  const reg = await navigator.serviceWorker.getRegistration();
  reg?.waiting?.postMessage({ type: 'SKIP_WAITING' });
  // Reload once the new SW takes control
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}
