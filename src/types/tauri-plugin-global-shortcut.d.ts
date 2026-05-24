declare module '@tauri-apps/plugin-global-shortcut' {
  export interface ShortcutEvent {
    shortcut: string;
    id: number;
    state: 'Released' | 'Pressed';
  }
  export type ShortcutHandler = (event: ShortcutEvent) => void;
  export function register(shortcuts: string | string[], handler: ShortcutHandler): Promise<void>;
  export function unregister(shortcuts: string | string[]): Promise<void>;
  export function unregisterAll(): Promise<void>;
  export function isRegistered(shortcut: string): Promise<boolean>;
}
