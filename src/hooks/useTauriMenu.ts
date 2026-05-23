// =============================================================================
// Tauri Menu Hook — Listen for native menu events and dispatch actions
// =============================================================================

import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

type MenuAction = (id: string) => void;

export function useTauriMenu(onAction?: MenuAction) {
  const navigate = useNavigate();

  const handleMenuEvent = useCallback(
    (event: { payload: string }) => {
      const id = event.payload;

      // Default actions
      switch (id) {
        case 'new_file':
          window.dispatchEvent(new CustomEvent('app:new-file'));
          break;
        case 'open_file':
          window.dispatchEvent(new CustomEvent('app:open-file'));
          break;
        case 'save_file':
          window.dispatchEvent(new CustomEvent('app:save-file'));
          break;
        case 'save_as':
          window.dispatchEvent(new CustomEvent('app:save-as'));
          break;
        case 'import_data':
          window.dispatchEvent(new CustomEvent('app:import'));
          break;
        case 'export_data':
          window.dispatchEvent(new CustomEvent('app:export'));
          break;
        case 'print':
          window.print();
          break;
        case 'quit':
          window.dispatchEvent(new CustomEvent('app:quit'));
          break;
        case 'undo':
          window.dispatchEvent(new CustomEvent('app:undo'));
          break;
        case 'redo':
          window.dispatchEvent(new CustomEvent('app:redo'));
          break;
        case 'toggle_sidebar':
          window.dispatchEvent(new CustomEvent('app:toggle-sidebar'));
          break;
        case 'toggle_formula_bar':
          window.dispatchEvent(new CustomEvent('app:toggle-formula-bar'));
          break;
        case 'toggle_status_bar':
          window.dispatchEvent(new CustomEvent('app:toggle-status-bar'));
          break;
        case 'consolidate':
          navigate('/consolidation');
          break;
        case 'scenarios':
          navigate('/scenarios');
          break;
        case 'reports':
          navigate('/reports');
          break;
        case 'validate_data':
          window.dispatchEvent(new CustomEvent('app:validate-data'));
          break;
        case 'options':
          navigate('/settings');
          break;
        case 'documentation':
          navigate('/help');
          break;
        case 'keyboard_shortcuts':
          window.dispatchEvent(new CustomEvent('app:show-shortcuts'));
          break;
        case 'about':
          window.dispatchEvent(new CustomEvent('app:show-about'));
          break;
        default:
          break;
      }

      // Forward to custom handler
      onAction?.(id);
    },
    [navigate, onAction]
  );

  useEffect(() => {
    // Dynamic import to avoid breaking web builds
    let unlisten: (() => void) | undefined;

    const setup = async () => {
      try {
        const { listen } = await import('@tauri-apps/api/event');
        unlisten = await listen<string>('menu-event', handleMenuEvent);
      } catch {
        // Not running in Tauri — ignore
      }
    };

    setup();

    return () => {
      unlisten?.();
    };
  }, [handleMenuEvent]);
}

// =============================================================================
// Global Shortcuts Hook — System-wide keyboard shortcuts
// =============================================================================

export function useGlobalShortcuts() {
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setup = async () => {
      try {
        const { register } = await import('@tauri-apps/plugin-global-shortcut');
        // Register global shortcuts
        await register('CommandOrControl+Shift+F', () => {
          window.dispatchEvent(new CustomEvent('app:quick-add'));
        });
        await register('CommandOrControl+Shift+B', () => {
          window.dispatchEvent(new CustomEvent('app:toggle-window'));
        });
      } catch {
        // Not running in Tauri or plugin not available
      }
    };

    setup();

    return () => {
      unlisten?.();
    };
  }, []);
}
