import { create } from 'zustand';
import { persist } from 'zustand/middleware';

let stored = JSON.stringify({ state: { x: 42 }, version: 0 });

const fakeStorage = {
  getItem: async () => stored,
  setItem: async (_name, value) => {
    stored = typeof value === 'string' ? value : JSON.stringify(value);
  },
  removeItem: async () => {},
};

const useStore = create()(
  persist(
    () => ({ x: 0 }),
    { name: 'probe', storage: fakeStorage }
  )
);

await new Promise((r) => setTimeout(r, 50));
console.log('hydrated x =', useStore.getState().x, '(expected 42 if strings hydrate)');
