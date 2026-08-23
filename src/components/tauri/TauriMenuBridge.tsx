import { useTauriMenu } from '@/hooks/useTauriMenu';

/**
 * Mounts the native-menu event listener inside the Router tree.
 *
 * W6-P0-07 (2026-08-24): the Tauri menu shipped inert end-to-end because
 * nothing ever mounted `useTauriMenu`. App.tsx renders this bridge once, so
 * every native menu click reaches the command map in src/hooks/useTauriMenu.ts.
 */
export function TauriMenuBridge() {
  useTauriMenu();
  return null;
}
