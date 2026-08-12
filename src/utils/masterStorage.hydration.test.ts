/**
 * @vitest-environment jsdom
 *
 * P0-2026-08-12 regression — zustand persist hydration through masterStorage.
 *
 * masterStorage.getItem previously returned the decrypted PLAINTEXT STRING.
 * Zustand persist v5's hydrate() reads `storageValue.state` / `.version`
 * directly and never JSON.parses a string return, so every persisted store
 * silently skipped hydration on boot: writes "succeeded" but state was never
 * restored after a restart (browser AND Tauri backends). Found by the F-02
 * browser visual baseline (the restored dashboard stayed empty). getItem now
 * returns the deserialized envelope object; this test pins the round trip so
 * the defect cannot regress.
 */
import { describe, expect, it } from 'vitest';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { masterStorage } from './masterStorage';

interface ProbeState {
  count: number;
  setCount: (n: number) => void;
}

function createProbeStore() {
  return create<ProbeState>()(
    persist((set) => ({ count: 0, setCount: (n) => set({ count: n }) }), {
      name: 'probe-store',
      storage: masterStorage,
    })
  );
}

async function settle(ms = 120): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

describe('zustand persist hydration through masterStorage (P0-2026-08-12)', () => {
  it('hydrates a fresh store instance from a previously persisted value', async () => {
    // Clean slate: a pre-existing value must not leak into the assertion.
    await masterStorage.removeItem('probe-store');

    const first = createProbeStore();
    first.getState().setCount(42);
    await settle(); // async encrypted write (sql.js mock backend)

    // A brand-new store instance with the same key must hydrate count = 42.
    const second = createProbeStore();
    await settle(); // async rehydration

    expect(second.getState().count).toBe(42);
  });

  it('hydrates the persisted envelope object, not a raw string', async () => {
    await masterStorage.setItem('probe-store', {
      state: { count: 7 },
      version: 0,
    });

    const store = createProbeStore();
    await settle();

    expect(store.getState().count).toBe(7);
  });
});
