import { act } from '@testing-library/react';
import type { StoreApi, UseBoundStore } from 'zustand';

export function resetStore<S>(store: UseBoundStore<StoreApi<S>>, initialState: S) {
  act(() => {
    store.setState(initialState, true);
  });
}

export function getStoreState<S>(store: UseBoundStore<StoreApi<S>>): S {
  return store.getState();
}

export function subscribeToStore<S>(
  store: UseBoundStore<StoreApi<S>>,
  callback: (state: S) => void
) {
  return store.subscribe(callback);
}
