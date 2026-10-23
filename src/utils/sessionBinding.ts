import { nowISO } from './clock';
import { sha256Hex } from './sha256';

/**
 * Device binding for the DEC-014 cached local session. The binding value
 * identifies THIS device profile: it is generated once, kept in plain
 * local storage (it is an identifier, not a credential), and only its
 * SHA-256 hash is stored inside the encrypted auth store. A cached
 * session copied to another device/profile fails the binding check.
 *
 * Honest scope note: true OS-user binding needs a native command
 * (Tauri OS plugin) that is not yet wired; device-profile binding is
 * the v1 mechanism and is labelled as such.
 */
export const DEVICE_BINDING_KEY = 'finplan-device-binding-v1';

export function resolveDeviceBinding(storage: Storage = localStorage): string {
  const existing = storage.getItem(DEVICE_BINDING_KEY);
  if (existing) return existing;
  const generated =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : sha256Hex(`${nowISO()}|${navigator.userAgent}`);
  storage.setItem(DEVICE_BINDING_KEY, generated);
  return generated;
}

export function hashBinding(binding: string): string {
  return sha256Hex(`finplan-session-binding-v1|${binding}`);
}
