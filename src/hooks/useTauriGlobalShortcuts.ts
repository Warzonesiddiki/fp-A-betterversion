import { useEffect } from 'react';
import { useCopilotSidebar } from './useCopilotSidebar';
import { createLogger } from '@/utils/logger';

const tauriShortcutsLogger = createLogger('TauriGlobalShortcuts');

export function useTauriGlobalShortcuts() {
  const toggleCopilot = useCopilotSidebar((state) => state.toggle);

  useEffect(() => {
    // Ensure we are in Tauri environment
    const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
    if (!isTauri) return;

    let mounted = true;
    // F-05 browser-beta hardening: the plugin is resolved lazily inside the
    // effect so a browser never statically evaluates the plugin module.
    let unregisterAll: (() => Promise<void>) | undefined;

    async function setupShortcuts() {
      try {
        const { register, unregisterAll: unregisterAllFn } =
          await import('@tauri-apps/plugin-global-shortcut');
        unregisterAll = unregisterAllFn;

        await unregisterAllFn();

        if (!mounted) return;

        // Ctrl+Shift+A for AI Copilot
        await register(
          'CommandOrControl+Shift+A',
          (event: import('@tauri-apps/plugin-global-shortcut').ShortcutEvent) => {
            if (event.state === 'Pressed') {
              toggleCopilot();
            }
          }
        );

        // Ctrl+Alt+S for Quick Save
        await register(
          'CommandOrControl+Alt+S',
          (event: import('@tauri-apps/plugin-global-shortcut').ShortcutEvent) => {
            if (event.state === 'Pressed') {
              // Emit a custom event that components can listen to for saving
              window.dispatchEvent(new CustomEvent('app:quick-save'));
            }
          }
        );
      } catch (error) {
        tauriShortcutsLogger.error('Failed to register global shortcuts', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    setupShortcuts();

    return () => {
      mounted = false;
      if (unregisterAll) {
        unregisterAll().catch((err) =>
          tauriShortcutsLogger.error('Failed to unregister global shortcuts', {
            error: err instanceof Error ? err.message : String(err),
          })
        );
      }
    };
  }, [toggleCopilot]);
}
