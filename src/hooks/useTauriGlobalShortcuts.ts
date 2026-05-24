import { useEffect } from 'react';
import { register, unregisterAll, type ShortcutEvent } from '@tauri-apps/plugin-global-shortcut';
import { useCopilotSidebar } from './useCopilotSidebar';

export function useTauriGlobalShortcuts() {
  const toggleCopilot = useCopilotSidebar((state) => state.toggle);

  useEffect(() => {
    // Ensure we are in Tauri environment
    const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
    if (!isTauri) return;

    let mounted = true;

    async function setupShortcuts() {
      try {
        await unregisterAll();

        if (!mounted) return;

        // Ctrl+Shift+A for AI Copilot
        await register('CommandOrControl+Shift+A', (event: ShortcutEvent) => {
          if (event.state === 'Pressed') {
            toggleCopilot();
          }
        });

        // Ctrl+Alt+S for Quick Save
        await register('CommandOrControl+Alt+S', (event: ShortcutEvent) => {
          if (event.state === 'Pressed') {
            // Emit a custom event that components can listen to for saving
            window.dispatchEvent(new CustomEvent('app:quick-save'));
          }
        });
      } catch (error) {
        console.error('Failed to register global shortcuts:', error);
      }
    }

    setupShortcuts();

    return () => {
      mounted = false;
      if (isTauri) {
        unregisterAll().catch(console.error);
      }
    };
  }, [toggleCopilot]);
}
