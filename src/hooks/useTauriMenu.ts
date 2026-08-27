// =============================================================================
// Tauri Menu Hook — bind native menu events to REAL frontend actions
// =============================================================================
//
// W6-P0-07 (2026-08-24): the native File/View/Tools menu shipped inert
// end-to-end. Binding is now an exhaustive command map over the shared id
// manifest in @/config/tauriMenuEvents — every id emitted by the Rust menu
// (src-tauri/src/main.rs) has exactly one real action, enforced by
// useTauriMenu.test.ts. The previous decorative dispatches of `app:*`
// CustomEvents that no component ever consumed were removed, together with
// the broken duplicate `useGlobalShortcuts` registration that lived in this
// file (superseded by ./useTauriGlobalShortcuts).

import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { NavigateFunction } from 'react-router-dom';

import { createLogger } from '@/utils/logger';
import { TAURI_MENU_EVENT_IDS } from '@/config/tauriMenuEvents';
import type { TauriMenuEventId } from '@/config/tauriMenuEvents';

const tauriMenuLogger = createLogger('TauriMenu');

type MenuAction = (id: string) => void;
type MenuCommand = () => void;

export type TauriMenuCommands = Record<TauriMenuEventId, MenuCommand>;

/** One honest action per native menu id; keys are compile-time-exhaustive. */
export function createMenuCommands(navigate: NavigateFunction): TauriMenuCommands {
  return {
    open_file: () => navigate('/data'),
    industry_dashboards: () => navigate('/sector/sector'),
    benchmarks: () => navigate('/admin/benchmarks'),
    debug: () => navigate('/admin/debug'),
  };
}

function lookupCommand(commands: TauriMenuCommands, id: string): MenuCommand | undefined {
  if (!(TAURI_MENU_EVENT_IDS as readonly string[]).includes(id)) return undefined;
  return commands[id as TauriMenuEventId];
}

export function useTauriMenu(onAction?: MenuAction) {
  const navigate = useNavigate();

  const handleMenuEvent = useCallback(
    (event: { payload: string }) => {
      const id = event.payload;
      const command = lookupCommand(createMenuCommands(navigate), id);
      if (command) {
        command();
      } else {
        // A Rust-side item without a frontend binding must surface loudly in
        // dev logs, never silently no-op (that was the W6-P0-07 failure mode).
        tauriMenuLogger.warn('Unhandled native menu event', { id });
      }

      // Extension point for callers needing to observe raw menu ids.
      onAction?.(id);
    },
    [navigate, onAction]
  );

  useEffect(() => {
    // Dynamic import keeps non-Tauri builds free of static @tauri-apps imports.
    // Cleanup mirrors useTauriGlobalShortcuts: a `cancelled` flag closes the
    // mount/unmount-before-resolve race where the original implementation
    // leaked the subscription forever.
    let cancelled = false;
    let unlisten: (() => void) | undefined;

    const setup = async () => {
      try {
        const { listen } = await import('@tauri-apps/api/event');
        const dispose = await listen<string>('menu-event', handleMenuEvent);
        if (cancelled) {
          dispose();
          return;
        }
        unlisten = dispose;
      } catch {
        // Not running in Tauri — ignore.
      }
    };

    void setup();

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [handleMenuEvent]);
}
